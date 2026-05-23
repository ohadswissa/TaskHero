import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MissionCategory, TraitCategory } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  instructions?: string;

  @ApiProperty({ enum: MissionCategory })
  @IsEnum(MissionCategory)
  category!: MissionCategory;

  @ApiPropertyOptional({ enum: TraitCategory })
  @IsEnum(TraitCategory)
  @IsOptional()
  traitCategory?: TraitCategory;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  heroWisdom?: string;

  @ApiProperty({ default: 10 })
  @IsInt()
  @Min(0)
  xpReward!: number;

  @ApiProperty({ default: 5 })
  @IsInt()
  @Min(0)
  coinReward!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  templateId?: string;
}
