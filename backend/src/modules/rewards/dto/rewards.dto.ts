import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRewardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  childProfileId!: string;

  @ApiProperty({ description: 'Reward goal name, e.g. "Pizza night"' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;

  @ApiProperty({
    description:
      'Target value to unlock the reward. Demo: coins threshold (COIN_THRESHOLD condition).',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  targetMissions!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;
}
