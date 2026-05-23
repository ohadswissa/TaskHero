import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assignmentId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'MinIO object keys for evidence photos (presigned upload is M2b)',
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(6)
  @IsOptional()
  photoUrls?: string[];
}
