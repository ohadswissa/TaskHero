import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListMissionTemplatesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by theme slug', example: 'heros-path' })
  @IsString()
  @IsOptional()
  theme?: string;
}

export class MissionTemplateThemeDto {
  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  color!: string | null;
}

export class MissionTemplateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ nullable: true })
  traitCategory!: string | null;

  @ApiProperty({ nullable: true })
  heroWisdom!: string | null;

  @ApiProperty()
  suggestedXp!: number;

  @ApiProperty()
  suggestedCoins!: number;

  @ApiProperty()
  difficulty!: number;

  @ApiProperty()
  themeId!: string;

  @ApiProperty({ type: MissionTemplateThemeDto })
  theme!: MissionTemplateThemeDto;
}
