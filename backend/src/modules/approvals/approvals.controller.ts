import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ApprovalsService } from './approvals.service';
import { VerifyAssignmentDto } from './dto';

@ApiTags('approvals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'List assignments awaiting verification (parent only)' })
  @ApiResponse({ status: 200, description: 'Pending submissions across the family' })
  async listPending(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.approvalsService.listPending(userId, familyId);
  }

  @Post(':assignmentId/verify')
  @ApiOperation({
    summary:
      'Verify a submitted assignment. Approves or rejects atomically with all side effects (XP, coins, trait, care item, evolution, reward, notification).',
  })
  @ApiResponse({ status: 201, description: 'Verification applied; returns summary DTO' })
  @ApiResponse({ status: 400, description: 'Assignment not in SUBMITTED state' })
  @ApiResponse({ status: 403, description: 'Assignment is not in your family' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async verify(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: VerifyAssignmentDto,
  ) {
    return this.approvalsService.verify(userId, familyId, assignmentId, dto);
  }
}
