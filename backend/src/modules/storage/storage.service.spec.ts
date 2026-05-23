import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { StorageService, PRESIGN_EXPIRES_SECONDS } from './storage.service';

// Mock the presigner BEFORE importing the service (jest hoists this).
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(async () => 'https://fake-presigned.example/upload?sig=abc'),
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ENDPOINT = 'http://localhost:9000';
const BUCKET = 'submissions';

function buildConfig(overrides: Record<string, string> = {}): ConfigService {
  const env: Record<string, string> = {
    S3_ENDPOINT: ENDPOINT,
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY: 'taskhero',
    S3_SECRET_KEY: 'taskhero_minio_password',
    S3_BUCKET_SUBMISSIONS: BUCKET,
    ...overrides,
  };
  return { get: (k: string, def?: string) => env[k] ?? def } as unknown as ConfigService;
}

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    (getSignedUrl as jest.Mock).mockClear();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService, { provide: ConfigService, useValue: buildConfig() }],
    }).compile();
    service = module.get<StorageService>(StorageService);
  });

  describe('getPresignedUploadUrl', () => {
    it('returns uploadUrl, publicUrl, key and expiresAt', async () => {
      const result = await service.getPresignedUploadUrl({
        userId: 'user-abc',
        contentType: 'image/jpeg',
        ext: 'jpg',
      });

      expect(getSignedUrl).toHaveBeenCalledTimes(1);
      const presignOpts = (getSignedUrl as jest.Mock).mock.calls[0][2];
      expect(presignOpts.expiresIn).toBe(PRESIGN_EXPIRES_SECONDS);

      expect(result.uploadUrl).toBe('https://fake-presigned.example/upload?sig=abc');
      expect(result.key).toMatch(/^user-abc\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.jpg$/);
      expect(result.publicUrl).toBe(`${ENDPOINT}/${BUCKET}/${result.key}`);
      // expiresAt is a parseable future ISO string
      expect(() => new Date(result.expiresAt).toISOString()).not.toThrow();
      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('sanitises the file extension', async () => {
      const result = await service.getPresignedUploadUrl({
        userId: 'user-xyz',
        contentType: 'image/png',
        ext: 'PNG',
      });
      expect(result.key.endsWith('.png')).toBe(true);
    });

    it('rate-limits to 10 presigns per minute per user', async () => {
      const params = { userId: 'rate-user', contentType: 'image/jpeg', ext: 'jpg' };
      for (let i = 0; i < 10; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await service.getPresignedUploadUrl(params);
      }
      await expect(service.getPresignedUploadUrl(params)).rejects.toMatchObject({
        constructor: HttpException,
      });
      // Status code is 429
      try {
        await service.getPresignedUploadUrl(params);
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('isolates rate-limit buckets per user', async () => {
      const a = { userId: 'a', contentType: 'image/jpeg', ext: 'jpg' };
      const b = { userId: 'b', contentType: 'image/jpeg', ext: 'jpg' };
      for (let i = 0; i < 10; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await service.getPresignedUploadUrl(a);
      }
      // User b should still succeed
      await expect(service.getPresignedUploadUrl(b)).resolves.toBeDefined();
    });
  });

  describe('buildPublicUrl', () => {
    it('joins endpoint + bucket + key', () => {
      expect(service.buildPublicUrl('foo/bar.jpg')).toBe(`${ENDPOINT}/${BUCKET}/foo/bar.jpg`);
    });
  });

  describe('extractKey', () => {
    it('strips the endpoint+bucket prefix from a full publicUrl', () => {
      const key = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/2026-05-23/abc.jpg';
      const url = `${ENDPOINT}/${BUCKET}/${key}`;
      expect(service.extractKey(url)).toBe(key);
    });
    it('returns the input unchanged when given a raw key', () => {
      const key = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/2026-05-23/abc.jpg';
      expect(service.extractKey(key)).toBe(key);
    });
    it('falls back to bucket-marker matching when endpoint host differs', () => {
      const key = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/2026-05-23/abc.jpg';
      const url = `http://other-host:9000/${BUCKET}/${key}`;
      expect(service.extractKey(url)).toBe(key);
    });
  });

  describe('parseOwnerUserId', () => {
    it('extracts the leading UUID segment', () => {
      const key = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/2026-05-23/abc.jpg';
      expect(service.parseOwnerUserId(key)).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    });
    it('rejects keys without a UUID-shaped owner segment (path traversal guard)', () => {
      expect(service.parseOwnerUserId('../etc/passwd')).toBeNull();
      expect(service.parseOwnerUserId('short/file.jpg')).toBeNull();
      expect(service.parseOwnerUserId('no-slash.jpg')).toBeNull();
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('returns key, url and an ISO expiresAt in the future', async () => {
      const key = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/2026-05-23/abc.jpg';
      const res = await service.getPresignedDownloadUrl(key);
      expect(getSignedUrl).toHaveBeenCalled();
      expect(res.key).toBe(key);
      expect(res.url).toBe('https://fake-presigned.example/upload?sig=abc');
      expect(new Date(res.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });
});
