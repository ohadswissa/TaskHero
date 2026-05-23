import { Body, Controller, Get, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { CreaturesService } from './creatures.service';
import { DevAdvanceCreatureDto, FeedCreatureDto, OnboardCreatureDto } from './dto';

/**
 * Feature flag for the dev-only fast-forward endpoint. Enabled when
 * DEMO_DEV_ENDPOINTS=true OR NODE_ENV !== 'production'. Returns false in
 * production by default so the route is invisible (responds 404).
 */
function isDevEndpointEnabled(): boolean {
  if (process.env.DEMO_DEV_ENDPOINTS === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

@ApiTags('creatures')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CHILD)
@Controller('creatures')
export class CreaturesController {
  constructor(private readonly creaturesService: CreaturesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the calling child creature (happiness pre-ticked)' })
  @ApiResponse({ status: 200, description: 'Creature with unconsumed care items' })
  @ApiResponse({ status: 404, description: 'Creature not yet hatched' })
  async getMine(@CurrentUser('userId') userId: string) {
    return this.creaturesService.getMine(userId);
  }

  @Post('me/onboard')
  @ApiOperation({ summary: 'Hatch or onboard the creature (EGG → BABY)' })
  @ApiResponse({ status: 201, description: 'Creature created or transitioned to BABY' })
  async onboard(@CurrentUser('userId') userId: string, @Body() dto: OnboardCreatureDto) {
    return this.creaturesService.onboard(userId, dto);
  }

  @Post('me/feed')
  @ApiOperation({ summary: 'Feed/consume a care item to boost happiness + trait' })
  @ApiResponse({ status: 201, description: 'Creature updated with new happiness and trait points' })
  @ApiResponse({ status: 404, description: 'Care item not found' })
  async feed(@CurrentUser('userId') userId: string, @Body() dto: FeedCreatureDto) {
    return this.creaturesService.feed(userId, dto);
  }

  @Post('me/dev-advance')
  @ApiOperation({
    summary: 'DEV-ONLY: Fast-forward the creature by N simulated missions. Disabled in production.',
  })
  @ApiResponse({ status: 201, description: 'Creature advanced; includes stageChanged + newStage' })
  @ApiResponse({ status: 404, description: 'Endpoint disabled or creature not hatched' })
  async devAdvance(@CurrentUser('userId') userId: string, @Body() dto: DevAdvanceCreatureDto) {
    if (!isDevEndpointEnabled()) {
      // Pretend the route doesn't exist in production.
      throw new NotFoundException();
    }
    return this.creaturesService.devAdvance(userId, dto);
  }
}
