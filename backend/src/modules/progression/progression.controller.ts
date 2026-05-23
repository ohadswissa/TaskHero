import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ProgressionService } from './progression.service';

@ApiTags('progression')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('progression')
export class ProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get('trait-summary')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: "Get trait summary for a child in the parent's family" })
  @ApiQuery({ name: 'childProfileId', required: true })
  @ApiResponse({ status: 200, description: '{ strength, wisdom, heart, total }' })
  async getTraitSummary(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Query('childProfileId') childProfileId: string,
  ) {
    return this.progressionService.getTraitSummaryForChild(userId, familyId, childProfileId);
  }

  @Get('mine')
  @Roles(UserRole.CHILD)
  @ApiOperation({ summary: "Get the calling child's own trait summary" })
  async getMine(@CurrentUser('userId') userId: string) {
    return this.progressionService.getMine(userId);
  }
}
