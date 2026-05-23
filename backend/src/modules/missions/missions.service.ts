import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database';
import { CreateMissionDto } from './dto';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the ParentProfile.id for the calling parent user.
   */
  private async resolveParentProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.parentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new ForbiddenException('Parent profile not found for current user');
    }
    return profile.id;
  }

  async create(userId: string, dto: CreateMissionDto) {
    const createdById = await this.resolveParentProfileId(userId);

    if (dto.templateId) {
      const template = await this.prisma.missionTemplate.findUnique({
        where: { id: dto.templateId },
        select: { id: true },
      });
      if (!template) {
        throw new NotFoundException('Mission template not found');
      }
    }

    return this.prisma.mission.create({
      data: {
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        category: dto.category,
        traitCategory: dto.traitCategory,
        heroWisdom: dto.heroWisdom,
        xpReward: dto.xpReward,
        coinReward: dto.coinReward,
        templateId: dto.templateId,
        createdById,
      },
    });
  }

  async listForParent(userId: string) {
    const createdById = await this.resolveParentProfileId(userId);

    return this.prisma.mission.findMany({
      where: { createdById },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { assignments: true } },
      },
    });
  }
}
