import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto';

@ApiTags('missions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mission (parent only)' })
  @ApiResponse({ status: 201, description: 'Mission created' })
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateMissionDto) {
    return this.missionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List missions created by the calling parent' })
  @ApiResponse({ status: 200, description: 'List of missions with assignment counts' })
  async list(@CurrentUser('userId') userId: string) {
    return this.missionsService.listForParent(userId);
  }
}
