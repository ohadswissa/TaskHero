import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database';
import { generateInviteCode } from '@/common/utils';
import { UserRole } from '@prisma/client';

@Injectable()
export class FamiliesService {
  private readonly logger = new Logger(FamiliesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const family = await this.prisma.family.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            parentProfile: true,
            childProfile: true,
          },
        },
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return family;
  }

  async findByInviteCode(inviteCode: string) {
    const family = await this.prisma.family.findUnique({
      where: { inviteCode },
    });

    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return family;
  }

  async update(id: string, data: { name?: string; timezone?: string; settings?: object }) {
    return this.prisma.family.update({
      where: { id },
      data: {
        name: data.name,
        timezone: data.timezone,
        settings: data.settings,
      },
    });
  }

  async regenerateInviteCode(id: string) {
    let newCode = generateInviteCode();
    let codeExists = await this.prisma.family.findUnique({
      where: { inviteCode: newCode },
    });

    while (codeExists) {
      newCode = generateInviteCode();
      codeExists = await this.prisma.family.findUnique({
        where: { inviteCode: newCode },
      });
    }

    return this.prisma.family.update({
      where: { id },
      data: { inviteCode: newCode },
    });
  }

  async getFamilyStats(id: string) {
    const family = await this.findById(id);

    const childCount = family.users.filter((u: { role: UserRole }) => u.role === 'CHILD').length;
    const parentCount = family.users.filter((u: { role: UserRole }) => u.role === 'PARENT').length;

    return {
      id: family.id,
      name: family.name,
      childCount,
      parentCount,
      createdAt: family.createdAt,
    };
  }
}
