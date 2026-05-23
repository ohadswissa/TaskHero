import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto';

@ApiTags('assignments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Assign a mission to a child (parent only)' })
  @ApiResponse({ status: 201, description: 'Assignment created (PENDING)' })
  async create(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(userId, familyId, dto);
  }

  @Get('mine')
  @Roles(UserRole.CHILD)
  @ApiOperation({ summary: 'List active assignments for the calling child' })
  @ApiResponse({ status: 200, description: 'Active assignments with full mission data' })
  async listMine(@CurrentUser('userId') userId: string) {
    return this.assignmentsService.listMine(userId);
  }

  @Get(':id')
  @Roles(UserRole.CHILD)
  @ApiOperation({ summary: 'Get a single assignment (child only, ownership-checked)' })
  @ApiResponse({ status: 200, description: 'Assignment with mission detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Not your assignment' })
  async findOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.assignmentsService.findOne(userId, id);
  }
}
