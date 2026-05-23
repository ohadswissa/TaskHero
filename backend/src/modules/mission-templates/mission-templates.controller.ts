import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { MissionTemplatesService } from './mission-templates.service';
import { ListMissionTemplatesQueryDto, MissionTemplateResponseDto } from './dto';

@ApiTags('mission-templates')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
@Controller('mission-templates')
export class MissionTemplatesController {
  constructor(private readonly service: MissionTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List active mission templates, optionally filtered by theme slug' })
  @ApiResponse({ status: 200, type: [MissionTemplateResponseDto] })
  async list(@Query() query: ListMissionTemplatesQueryDto) {
    return this.service.list(query.theme);
  }
}
