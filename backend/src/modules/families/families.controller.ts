import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FamiliesService } from './families.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { CurrentUser, Roles } from '@/common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('families')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user family' })
  @ApiResponse({ status: 200, description: 'Family details' })
  async getMyFamily(@CurrentUser('familyId') familyId: string) {
    return this.familiesService.findById(familyId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get family statistics' })
  @ApiResponse({ status: 200, description: 'Family statistics' })
  async getFamilyStats(@CurrentUser('familyId') familyId: string) {
    return this.familiesService.getFamilyStats(familyId);
  }

  @Patch('me')
  @Roles(UserRole.PARENT)
  @ApiOperation({ summary: 'Update family settings' })
  @ApiResponse({ status: 200, description: 'Family updated' })
  async updateFamily(
    @CurrentUser('familyId') familyId: string,
    @Body() data: { name?: string; timezone?: string },
  ) {
    return this.familiesService.update(familyId, data);
  }

  @Post('me/regenerate-code')
  @Roles(UserRole.PARENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate family invite code' })
  @ApiResponse({ status: 200, description: 'New invite code generated' })
  async regenerateInviteCode(@CurrentUser('familyId') familyId: string) {
    return this.familiesService.regenerateInviteCode(familyId);
  }
}
