import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChildrenService, CreateChildDto } from './children.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { CurrentUser, Roles } from '@/common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('children')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('children')
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Post()
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Create a new child profile' })
  @ApiResponse({ status: 201, description: 'Child created successfully' })
  async create(@CurrentUser('familyId') familyId: string, @Body() dto: CreateChildDto) {
    return this.childrenService.create(familyId, dto);
  }

  @Get()
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Get all children in family' })
  @ApiResponse({ status: 200, description: 'List of children' })
  async findAll(@CurrentUser('familyId') familyId: string) {
    return this.childrenService.findByFamily(familyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get child profile by ID' })
  @ApiResponse({ status: 200, description: 'Child profile details' })
  async findOne(@Param('id') id: string) {
    return this.childrenService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Update child profile' })
  @ApiResponse({ status: 200, description: 'Child updated' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateChildDto>) {
    return this.childrenService.update(id, dto);
  }

  @Post(':id/reset-pin')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Reset child PIN' })
  @ApiResponse({ status: 200, description: 'New PIN generated' })
  async resetPin(@Param('id') id: string) {
    return this.childrenService.resetPin(id);
  }

  @Delete(':id')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Deactivate child profile' })
  @ApiResponse({ status: 200, description: 'Child deactivated' })
  async deactivate(@Param('id') id: string) {
    return this.childrenService.deactivate(id);
  }
}
