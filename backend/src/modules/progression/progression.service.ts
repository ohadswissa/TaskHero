import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database';

export interface TraitSummary {
  strength: number;
  wisdom: number;
  heart: number;
  total: number;
}

@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  private summarize(strength: number, wisdom: number, heart: number): TraitSummary {
    return {
      strength,
      wisdom,
      heart,
      total: strength + wisdom + heart,
    };
  }

  /**
   * Parent reads any child's trait summary, scoped to the same family.
   */
  async getTraitSummaryForChild(
    parentUserId: string,
    parentFamilyId: string,
    childProfileId: string,
  ): Promise<TraitSummary> {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId: parentUserId },
      select: { id: true },
    });
    if (!parent) {
      throw new ForbiddenException('Parent profile not found for current user');
    }

    const child = await this.prisma.childProfile.findUnique({
      where: { id: childProfileId },
      include: {
        user: { select: { familyId: true } },
        creature: true,
      },
    });

    if (!child) {
      throw new NotFoundException('Child profile not found');
    }
    if (child.user.familyId !== parentFamilyId) {
      throw new ForbiddenException('Child does not belong to your family');
    }

    if (!child.creature) {
      return this.summarize(0, 0, 0);
    }

    return this.summarize(
      child.creature.strengthPoints,
      child.creature.wisdomPoints,
      child.creature.heartPoints,
    );
  }

  /**
   * Child reads their own trait summary.
   */
  async getMine(userId: string): Promise<TraitSummary> {
    const child = await this.prisma.childProfile.findUnique({
      where: { userId },
      include: { creature: true },
    });
    if (!child) {
      throw new ForbiddenException('Child profile not found for current user');
    }
    if (!child.creature) {
      return this.summarize(0, 0, 0);
    }
    return this.summarize(
      child.creature.strengthPoints,
      child.creature.wisdomPoints,
      child.creature.heartPoints,
    );
  }
}
