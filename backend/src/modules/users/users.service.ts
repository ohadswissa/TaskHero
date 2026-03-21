import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        parentProfile: true,
        childProfile: {
          include: { hero: true },
        },
        family: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    return user;
  }

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { parentProfile: true, childProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.parentProfile) {
      await this.prisma.parentProfile.update({
        where: { userId },
        data,
      });
    } else if (user.childProfile) {
      await this.prisma.childProfile.update({
        where: { userId },
        data,
      });
    }

    return this.findById(userId);
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { passwordHash: _passwordHash, pin: _pin, ...sanitized } = user;
    return sanitized;
  }
}
