import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database';
import { UserRole } from '@prisma/client';
import { generatePin } from '@/common/utils';

export interface CreateChildDto {
  displayName: string;
  dateOfBirth?: Date;
  avatarUrl?: string;
  pin?: string;
}

@Injectable()
export class ChildrenService {
  private readonly logger = new Logger(ChildrenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(familyId: string, dto: CreateChildDto) {
    // Generate unique PIN within family
    let pin = dto.pin || generatePin();
    let pinExists = await this.prisma.user.findFirst({
      where: { familyId, pin, role: UserRole.CHILD },
    });

    while (pinExists) {
      pin = generatePin();
      pinExists = await this.prisma.user.findFirst({
        where: { familyId, pin, role: UserRole.CHILD },
      });
    }

    // Create child user with profile and hero
    const user = await this.prisma.user.create({
      data: {
        role: UserRole.CHILD,
        familyId,
        pin,
        childProfile: {
          create: {
            displayName: dto.displayName,
            dateOfBirth: dto.dateOfBirth,
            avatarUrl: dto.avatarUrl,
            hero: {
              create: {
                name: dto.displayName,
              },
            },
          },
        },
      },
      include: {
        childProfile: {
          include: { hero: true },
        },
      },
    });

    this.logger.log(`Created child profile: ${dto.displayName}`);

    return {
      id: user.childProfile?.id,
      userId: user.id,
      displayName: dto.displayName,
      pin,
      hero: user.childProfile?.hero,
    };
  }

  async findByFamily(familyId: string) {
    const children = await this.prisma.childProfile.findMany({
      where: {
        user: { familyId },
      },
      include: {
        hero: true,
        user: {
          select: { id: true, isActive: true },
        },
      },
    });

    return children;
  }

  async findById(id: string) {
    const child = await this.prisma.childProfile.findUnique({
      where: { id },
      include: {
        hero: true,
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
        },
        miniGameUnlocks: {
          include: { miniGame: true },
        },
        rewardUnlocks: {
          include: { reward: true },
        },
        user: {
          select: { id: true, familyId: true, isActive: true },
        },
      },
    });

    if (!child) {
      throw new NotFoundException('Child profile not found');
    }

    return child;
  }

  async update(id: string, data: Partial<CreateChildDto>) {
    return this.prisma.childProfile.update({
      where: { id },
      data: {
        displayName: data.displayName,
        dateOfBirth: data.dateOfBirth,
        avatarUrl: data.avatarUrl,
      },
      include: { hero: true },
    });
  }

  async resetPin(id: string) {
    const child = await this.prisma.childProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!child) {
      throw new NotFoundException('Child profile not found');
    }

    // Generate new unique PIN
    let newPin = generatePin();
    let pinExists = await this.prisma.user.findFirst({
      where: {
        familyId: child.user.familyId,
        pin: newPin,
        role: UserRole.CHILD,
        id: { not: child.user.id },
      },
    });

    while (pinExists) {
      newPin = generatePin();
      pinExists = await this.prisma.user.findFirst({
        where: {
          familyId: child.user.familyId,
          pin: newPin,
          role: UserRole.CHILD,
          id: { not: child.user.id },
        },
      });
    }

    await this.prisma.user.update({
      where: { id: child.user.id },
      data: { pin: newPin },
    });

    return { pin: newPin };
  }

  async deactivate(id: string) {
    const child = await this.prisma.childProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!child) {
      throw new NotFoundException('Child profile not found');
    }

    await this.prisma.user.update({
      where: { id: child.user.id },
      data: { isActive: false },
    });

    return { success: true };
  }
}
