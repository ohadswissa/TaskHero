import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto';

@ApiTags('rewards')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Create a reward goal (parent only). Single-active enforced.' })
  @ApiResponse({ status: 201, description: 'Reward created with status=ACTIVE' })
  async create(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() dto: CreateRewardDto,
  ) {
    return this.rewardsService.create(userId, familyId, dto);
  }

  @Get('family')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'List all reward goals in the family grouped by status' })
  async listFamily(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.rewardsService.listFamily(userId, familyId);
  }

  @Get('mine/active')
  @Roles(UserRole.CHILD)
  @ApiOperation({ summary: "Get the calling child's single active reward goal with progress" })
  async getMineActive(@CurrentUser('userId') userId: string) {
    return this.rewardsService.getMineActive(userId);
  }

  @Post(':id/redeem')
  @Roles(UserRole.PARENT, UserRole.CHILD)
  @ApiOperation({ summary: 'Redeem a reward whose threshold has been reached' })
  async redeem(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.rewardsService.redeem(userId, familyId, role as UserRole, id);
  }
}
