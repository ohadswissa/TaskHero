import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { HERO_MAIL_MAX_LENGTH } from '@/common/utils/progression';

export class VerifyAssignmentDto {
  @ApiProperty({ description: 'Whether the parent approves the submission' })
  @IsBoolean()
  approved!: boolean;

  @ApiPropertyOptional({
    description: 'Optional Hero Mail message from the parent (max 280 chars)',
    maxLength: HERO_MAIL_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(HERO_MAIL_MAX_LENGTH)
  parentMessage?: string;
}
