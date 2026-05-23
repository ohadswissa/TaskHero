import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database';

@Injectable()
export class MissionTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(themeSlug?: string) {
    const templates = await this.prisma.missionTemplate.findMany({
      where: {
        isActive: true,
        ...(themeSlug ? { theme: { slug: themeSlug } } : {}),
      },
      orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        traitCategory: true,
        heroWisdom: true,
        suggestedXp: true,
        suggestedCoins: true,
        difficulty: true,
        themeId: true,
        theme: {
          select: { slug: true, name: true, color: true },
        },
      },
    });

    return templates;
  }
}
