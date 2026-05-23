import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database';
import { AssignmentStatus, UserRole } from '@prisma/client';
import { CreateAssignmentDto } from './dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private async resolveChildProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.childProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new ForbiddenException('Child profile not found for current user');
    }
    return profile.id;
  }

  /**
   * Parent assigns one of their missions to a child within their family.
   */
  async create(userId: string, familyId: string, dto: CreateAssignmentDto) {
    const parentProfileId = await this.resolveParentProfileId(userId);

    // Validate the mission belongs to this parent
    const mission = await this.prisma.mission.findUnique({
      where: { id: dto.missionId },
      select: { id: true, createdById: true },
    });
    if (!mission) {
      throw new NotFoundException('Mission not found');
    }
    if (mission.createdById !== parentProfileId) {
      throw new ForbiddenException('Mission does not belong to the calling parent');
    }

    // Validate the child belongs to the parent's family
    const child = await this.prisma.childProfile.findUnique({
      where: { id: dto.childProfileId },
      select: { user: { select: { familyId: true, role: true } } },
    });
    if (!child || child.user.role !== UserRole.CHILD) {
      throw new NotFoundException('Child profile not found');
    }
    if (child.user.familyId !== familyId) {
      throw new ForbiddenException('Child does not belong to your family');
    }

    return this.prisma.missionAssignment.create({
      data: {
        missionId: dto.missionId,
        childProfileId: dto.childProfileId,
        status: AssignmentStatus.PENDING,
      },
    });
  }

  /**
   * Returns active assignments (PENDING / IN_PROGRESS) for the calling child.
   */
  async listMine(userId: string) {
    const childProfileId = await this.resolveChildProfileId(userId);

    return this.prisma.missionAssignment.findMany({
      where: {
        childProfileId,
        status: { in: [AssignmentStatus.PENDING, AssignmentStatus.IN_PROGRESS] },
      },
      orderBy: { assignedAt: 'desc' },
      include: {
        mission: true,
      },
    });
  }

  /**
   * Returns a single assignment for the calling child (ownership-checked).
   */
  async findOne(userId: string, id: string) {
    const childProfileId = await this.resolveChildProfileId(userId);

    const assignment = await this.prisma.missionAssignment.findUnique({
      where: { id },
      include: { mission: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    if (assignment.childProfileId !== childProfileId) {
      throw new ForbiddenException('Assignment does not belong to you');
    }

    return assignment;
  }
}
