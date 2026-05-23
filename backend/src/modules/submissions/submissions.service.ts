import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database';
import { AssignmentStatus } from '@prisma/client';
import { CreateSubmissionDto } from './dto';

// M5a: the deferred MinIO presigned upload workflow now lives in
// `backend/src/modules/storage/`. The mobile client calls `POST /storage/presign`
// to obtain a PUT URL + canonical `publicUrl`, uploads the file, and passes
// the array of public URLs here as `photoUrls`. This service stores them
// verbatim on `MissionSubmission.photoUrls`.

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(userId: string, dto: CreateSubmissionDto) {
    const childProfileId = await this.resolveChildProfileId(userId);

    const assignment = await this.prisma.missionAssignment.findUnique({
      where: { id: dto.assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    if (assignment.childProfileId !== childProfileId) {
      throw new ForbiddenException('Assignment does not belong to you');
    }
    if (
      assignment.status !== AssignmentStatus.PENDING &&
      assignment.status !== AssignmentStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Assignment cannot be submitted from status ${assignment.status}`,
      );
    }

    const now = new Date();
    const [submission] = await this.prisma.$transaction([
      this.prisma.missionSubmission.create({
        data: {
          assignmentId: assignment.id,
          childProfileId,
          notes: dto.notes,
          photoUrls: dto.photoUrls ?? [],
        },
      }),
      this.prisma.missionAssignment.update({
        where: { id: assignment.id },
        data: {
          status: AssignmentStatus.SUBMITTED,
          completedAt: now,
        },
      }),
    ]);

    return submission;
  }
}
