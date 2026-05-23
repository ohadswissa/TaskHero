import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto';

@ApiTags('submissions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CHILD)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a mission for parent review (child only)' })
  @ApiResponse({ status: 201, description: 'Submission created, assignment marked SUBMITTED' })
  @ApiResponse({ status: 400, description: 'Assignment not in submittable state' })
  @ApiResponse({ status: 403, description: 'Assignment does not belong to you' })
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(userId, dto);
  }
}
