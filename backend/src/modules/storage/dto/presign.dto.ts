import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Allowed MIME types for child submission photos. Locked to common image
 * types so the presign workflow cannot be abused as a general-purpose
 * storage backdoor. Extend in M5b/M6 as additional use-cases land.
 */
export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export class PresignUploadDto {
  @ApiProperty({
    description: 'MIME type the client will upload',
    enum: ALLOWED_CONTENT_TYPES,
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_CONTENT_TYPES as unknown as string[])
  contentType!: (typeof ALLOWED_CONTENT_TYPES)[number];

  @ApiProperty({
    description: 'File extension WITHOUT the dot (jpg, png, webp...)',
    example: 'jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  @Matches(/^[a-z0-9]+$/i, { message: 'ext must be alphanumeric, no dot' })
  ext!: string;
}

export class PresignResponseDto {
  @ApiProperty({ description: 'PUT this URL with the raw file bytes' })
  uploadUrl!: string;

  @ApiProperty({
    description: 'Canonical public URL — store this in MissionSubmission.photoUrls[]',
  })
  publicUrl!: string;

  @ApiProperty({ description: 'Object key inside the bucket' })
  key!: string;

  @ApiProperty({ description: 'ISO timestamp at which the upload URL expires' })
  expiresAt!: string;
}

// =========================================================================
// Presign-read — short-lived GetObject URLs so the parent's Verify screen
// can render private submission photos without making the bucket public.
// =========================================================================

export class PresignReadRequestDto {
  @ApiProperty({
    description:
      'Bucket object keys (or full publicUrls — the server normalises) for which to mint short-lived GET URLs',
    example: ['child-user-id/2026-05-23/abc.jpg'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  keys!: string[];
}

export class PresignReadItemDto {
  @ApiProperty({ description: 'Original object key' })
  key!: string;

  @ApiProperty({ description: 'Short-lived GET URL for this key' })
  url!: string;

  @ApiProperty({ description: 'ISO timestamp at which the GET URL expires' })
  expiresAt!: string;
}

export class PresignReadResponseDto {
  @ApiProperty({ type: [PresignReadItemDto] })
  items!: PresignReadItemDto[];
}
