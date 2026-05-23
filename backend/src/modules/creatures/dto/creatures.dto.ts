import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CreatureSpecies } from '@prisma/client';

export class OnboardCreatureDto {
  @ApiProperty({ enum: CreatureSpecies })
  @IsEnum(CreatureSpecies)
  species!: CreatureSpecies;

  @ApiPropertyOptional({ description: 'Custom creature name (defaults to species default)' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  name?: string;
}

export class FeedCreatureDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  careItemId!: string;
}

export class DevAdvanceCreatureDto {
  @ApiProperty({
    description: 'Number of mission advancements to simulate (1–200)',
    minimum: 1,
    maximum: 200,
  })
  @IsInt()
  @Min(1)
  @Max(200)
  missions!: number;
}
