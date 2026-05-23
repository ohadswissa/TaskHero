import { Body, Controller, ForbiddenException, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { PrismaService } from '@/database';
import { StorageService } from './storage.service';
import {
  PresignReadRequestDto,
  PresignReadResponseDto,
  PresignResponseDto,
  PresignUploadDto,
} from './dto';

@ApiTags('storage')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CHILD, UserRole.PARENT)
@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('presign')
  @ApiOperation({
    summary:
      'Generate a presigned PUT URL for uploading a single photo to MinIO. Valid for 5 minutes.',
  })
  @ApiResponse({ status: 201, description: 'Presign DTO with uploadUrl + publicUrl + key' })
  @ApiResponse({ status: 429, description: 'Too many presign requests (10/min/user)' })
  async presign(
    @CurrentUser('userId') userId: string,
    @Body() dto: PresignUploadDto,
  ): Promise<PresignResponseDto> {
    return this.storageService.getPresignedUploadUrl({
      userId,
      contentType: dto.contentType,
      ext: dto.ext,
    });
  }

  @Post('presign-read')
  @ApiOperation({
    summary:
      'Mint short-lived GET URLs for private submission photos. Caller must belong to the same family as the key owner.',
  })
  @ApiResponse({ status: 201, description: 'Array of {key,url,expiresAt}' })
  @ApiResponse({ status: 403, description: 'A requested key is outside the caller family' })
  async presignRead(
    @CurrentUser('familyId') familyId: string,
    @Body() dto: PresignReadRequestDto,
  ): Promise<PresignReadResponseDto> {
    // Normalise: clients may send either a full publicUrl or a raw key.
    const keys = dto.keys.map((k) => this.storageService.extractKey(k));

    // Authorise — every key's owner userId prefix must resolve to the caller's family.
    const ownerIds = new Set<string>();
    for (const key of keys) {
      const owner = this.storageService.parseOwnerUserId(key);
      if (!owner) {
        throw new ForbiddenException(`Malformed key: ${key}`);
      }
      ownerIds.add(owner);
    }

    if (ownerIds.size > 0) {
      const owners = await this.prisma.user.findMany({
        where: { id: { in: Array.from(ownerIds) } },
        select: { id: true, familyId: true },
      });
      const ownerById = new Map(owners.map((u) => [u.id, u.familyId]));
      for (const ownerId of ownerIds) {
        const ownerFamily = ownerById.get(ownerId);
        if (!ownerFamily || ownerFamily !== familyId) {
          throw new ForbiddenException('Key is outside your family');
        }
      }
    }

    const items = await Promise.all(
      keys.map((key) => this.storageService.getPresignedDownloadUrl(key)),
    );
    return { items };
  }
}
