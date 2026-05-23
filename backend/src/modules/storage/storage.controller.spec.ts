import { ForbiddenException } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import type { PrismaService } from '@/database';

/**
 * Family-scope authorization tests for POST /storage/presign-read.
 * The controller is the security boundary — it must reject keys whose
 * owner userId does not belong to the caller's family.
 */
describe('StorageController#presignRead', () => {
  const FAMILY_A = 'family-a';
  const FAMILY_B = 'family-b';
  const USER_IN_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const USER_IN_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  function makeController(opts: {
    storage?: Partial<StorageService>;
    prisma?: Partial<PrismaService>;
  }) {
    const storage = {
      extractKey: jest.fn((k: string) => k),
      parseOwnerUserId: jest.fn((k: string) => k.split('/')[0] || null),
      getPresignedDownloadUrl: jest.fn(async (k: string) => ({
        key: k,
        url: `https://signed.example/${k}`,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      })),
      ...(opts.storage ?? {}),
    } as unknown as StorageService;

    const prisma = {
      user: {
        findMany: jest.fn(async ({ where }: any) => {
          const ids: string[] = where.id.in;
          return ids.map((id) => ({
            id,
            familyId: id === USER_IN_A ? FAMILY_A : id === USER_IN_B ? FAMILY_B : 'family-unknown',
          }));
        }),
      },
      ...(opts.prisma ?? {}),
    } as unknown as PrismaService;

    return new StorageController(storage, prisma);
  }

  it('mints presigned URLs for keys owned by the caller’s family', async () => {
    const ctrl = makeController({});
    const key = `${USER_IN_A}/2026-05-23/photo.jpg`;
    const res = await ctrl.presignRead(FAMILY_A, { keys: [key] });
    expect(res.items).toHaveLength(1);
    expect(res.items[0].key).toBe(key);
    expect(res.items[0].url).toContain('https://signed.example/');
  });

  it('rejects a key owned by a user in another family', async () => {
    const ctrl = makeController({});
    const key = `${USER_IN_B}/2026-05-23/photo.jpg`;
    await expect(ctrl.presignRead(FAMILY_A, { keys: [key] })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects malformed keys (path-traversal guard)', async () => {
    const ctrl = makeController({
      storage: {
        extractKey: ((k: string) => k) as never,
        parseOwnerUserId: (() => null) as never,
      },
    });
    await expect(ctrl.presignRead(FAMILY_A, { keys: ['../etc/passwd'] })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
