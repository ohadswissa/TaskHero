import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { PresignResponseDto } from './dto';

/** 5 minute presign validity, per M2c/M5a spec. */
export const PRESIGN_EXPIRES_SECONDS = 5 * 60;
/** Read-presign validity — short window since parent's verify screen is ephemeral. */
export const PRESIGN_READ_EXPIRES_SECONDS = 5 * 60;

/** Throttle limit per user per minute (in-memory; replace with Redis in prod). */
const PRESIGN_RATE_LIMIT = 10;
const PRESIGN_RATE_WINDOW_MS = 60_000;

interface PresignParams {
  userId: string;
  contentType: string;
  ext: string;
}

/**
 * Storage service for child mission submission photos.
 *
 * Talks to a local MinIO instance via the AWS SDK — MinIO is wire-compat
 * with the S3 protocol so the same client works against MinIO/R2/S3.
 *
 * Wire-up:
 *  - Reads S3_ENDPOINT / S3_REGION / S3_ACCESS_KEY / S3_SECRET_KEY /
 *    S3_BUCKET_SUBMISSIONS from ConfigService.
 *  - On boot ensures the bucket exists (HeadBucket → CreateBucket on 404).
 *  - `getPresignedUploadUrl()` returns a PUT URL valid for 5 minutes plus
 *    the canonical `publicUrl` the mobile client stores in
 *    `MissionSubmission.photoUrls[]`.
 *
 * Production swap-in: when migrating to managed object storage, swap the
 * endpoint/creds and (optionally) override publicUrl to a CDN base. No
 * consumer code needs to change.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly endpoint: string;
  private readonly region: string;
  private readonly bucket: string;

  // userId -> array of recent presign timestamps (ms)
  private readonly recentPresigns = new Map<string, number[]>();

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    this.region = this.configService.get<string>('S3_REGION', 'us-east-1');
    this.bucket = this.configService.get<string>('S3_BUCKET_SUBMISSIONS', 'submissions');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY', 'minioadmin');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY', 'minioadmin');

    this.client = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      credentials: { accessKeyId, secretAccessKey },
      // MinIO + presigner require path-style addressing (no DNS bucket vhosts).
      forcePathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucket();
  }

  /**
   * Idempotently ensure the submissions bucket exists. Logs the outcome but
   * does NOT throw on init — the API surface should boot even if MinIO is
   * temporarily unavailable; presign calls will then 5xx individually.
   */
  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Storage ready — bucket "${this.bucket}" exists at ${this.endpoint}`);
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number }; name?: string }).$metadata
        ?.httpStatusCode;
      const name = (err as { name?: string }).name;
      // 404 NotFound or NoSuchBucket → create. Other errors (network, auth)
      // are logged but not fatal.
      if (status === 404 || name === 'NotFound' || name === 'NoSuchBucket') {
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Created bucket "${this.bucket}" at ${this.endpoint}`);
        } catch (createErr) {
          this.logger.error(
            `Failed to create bucket "${this.bucket}": ${(createErr as Error).message}`,
          );
        }
      } else {
        this.logger.warn(
          `HeadBucket("${this.bucket}") failed (${name ?? 'unknown'}): ${(err as Error).message}`,
        );
      }
    }
  }

  /**
   * Generate a PutObject presigned URL valid for PRESIGN_EXPIRES_SECONDS.
   * Object key pattern: `<userId>/<yyyy-mm-dd>/<uuid>.<ext>` (bucket already
   * scoped to submissions, so no extra prefix is needed).
   */
  async getPresignedUploadUrl(params: PresignParams): Promise<PresignResponseDto> {
    this.enforceRateLimit(params.userId);

    const today = new Date();
    const datePart = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const safeExt = params.ext.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${params.userId}/${datePart}/${randomUUID()}.${safeExt}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });

    const publicUrl = this.buildPublicUrl(key);
    const expiresAt = new Date(Date.now() + PRESIGN_EXPIRES_SECONDS * 1000).toISOString();

    this.logger.debug(`Presigned upload for user=${params.userId} key=${key}`);

    return { uploadUrl, publicUrl, key, expiresAt };
  }

  /**
   * MinIO public URL format: `<endpoint>/<bucket>/<key>`. The bucket is
   * private; readers must call `getPresignedDownloadUrl()` first.
   */
  buildPublicUrl(key: string): string {
    return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
  }

  /**
   * Normalise an input that may be either a full publicUrl (the form stored
   * in `MissionSubmission.photoUrls[]`) or a raw object key. Returns the
   * canonical object key suitable for a `GetObjectCommand`.
   *
   * Accepts: `<endpoint>/<bucket>/<key>` or `<key>`.
   */
  extractKey(input: string): string {
    const prefix = `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/`;
    if (input.startsWith(prefix)) return input.slice(prefix.length);
    // Fallback — match `…/<bucket>/<key>` in case the endpoint host differs
    // (e.g. dev vs LAN IP). Be conservative: require the bucket segment.
    const marker = `/${this.bucket}/`;
    const idx = input.indexOf(marker);
    if (idx >= 0) return input.slice(idx + marker.length);
    return input;
  }

  /**
   * Validate that an object key is owned by a member of the requester's
   * family. Our upload key convention is `<userId>/<yyyy-mm-dd>/<uuid>.<ext>`,
   * so we extract the leading userId segment and look up that user. The
   * caller (controller) provides a resolver to keep this module DB-free.
   */
  parseOwnerUserId(key: string): string | null {
    const slash = key.indexOf('/');
    if (slash <= 0) return null;
    const owner = key.slice(0, slash);
    // Defensive: userIds are CUIDs (or UUIDs) in this app — alphanumeric +
    // dashes, at least 20 chars. Reject anything else so a crafted key
    // cannot map to "../../something".
    if (!/^[a-z0-9-]{20,}$/i.test(owner)) return null;
    return owner;
  }

  /**
   * Mint a short-lived GET presigned URL for a private bucket object.
   * Callers must enforce authorization (family scope) BEFORE calling.
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = PRESIGN_READ_EXPIRES_SECONDS,
  ): Promise<{ key: string; url: string; expiresAt: string }> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const url = await getSignedUrl(this.client, cmd, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    return { key, url, expiresAt };
  }

  /**
   * Crude in-memory per-user rate limiter for the presign endpoint.
   * TODO(prod): swap for the existing @nestjs/throttler with a custom key
   * (userId instead of IP) once Redis throttler storage is wired in.
   */
  private enforceRateLimit(userId: string): void {
    const now = Date.now();
    const bucket = this.recentPresigns.get(userId) ?? [];
    const fresh = bucket.filter((t) => now - t < PRESIGN_RATE_WINDOW_MS);
    if (fresh.length >= PRESIGN_RATE_LIMIT) {
      throw new HttpException(
        `Too many presign requests; max ${PRESIGN_RATE_LIMIT} per minute`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    fresh.push(now);
    this.recentPresigns.set(userId, fresh);
  }
}
