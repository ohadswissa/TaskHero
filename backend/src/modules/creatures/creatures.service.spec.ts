import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CreaturesService } from './creatures.service';
import { PrismaService } from '@/database/prisma.service';
import { CreatureSpecies, EvolutionStage } from '@prisma/client';
import { HAPPINESS_DEPLETION_PER_HOUR } from '@/common/utils/progression';

/**
 * Unit test for CreaturesService.getMine — specifically that happiness is
 * ticked down based on elapsed time and persisted on read.
 *
 * Full integration tests (with a real Prisma + DB) live in M2c.
 */
describe('CreaturesService - happiness tick on getMine', () => {
  let service: CreaturesService;
  let prismaMock: {
    childProfile: { findUnique: jest.Mock };
    creature: { findUnique: jest.Mock; update: jest.Mock };
  };

  const USER_ID = 'user-123';
  const CHILD_PROFILE_ID = 'child-123';
  const CREATURE_ID = 'creature-123';

  beforeEach(async () => {
    prismaMock = {
      childProfile: { findUnique: jest.fn() },
      creature: { findUnique: jest.fn(), update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CreaturesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<CreaturesService>(CreaturesService);
  });

  it('depletes happiness based on elapsed hours and persists the new value', async () => {
    const hoursElapsed = 4;
    const initialHappiness = 80;
    const lastTickAt = new Date(Date.now() - hoursElapsed * 60 * 60 * 1000);
    const expectedHappiness = Math.round(
      initialHappiness - hoursElapsed * HAPPINESS_DEPLETION_PER_HOUR,
    );

    prismaMock.childProfile.findUnique.mockResolvedValue({ id: CHILD_PROFILE_ID });
    prismaMock.creature.findUnique.mockResolvedValue({
      id: CREATURE_ID,
      childProfileId: CHILD_PROFILE_ID,
      species: CreatureSpecies.FOREST_PUP,
      name: 'Mossy',
      stage: EvolutionStage.BABY,
      happiness: initialHappiness,
      lastHappinessTickAt: lastTickAt,
      pendingCareItems: [],
    });
    prismaMock.creature.update.mockImplementation(({ data }: { data: { happiness: number } }) => ({
      id: CREATURE_ID,
      happiness: data.happiness,
      pendingCareItems: [],
    }));

    const result = (await service.getMine(USER_ID)) as { happiness: number };

    expect(prismaMock.creature.update).toHaveBeenCalledTimes(1);
    const updateCall = prismaMock.creature.update.mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: CREATURE_ID });
    expect(updateCall.data.happiness).toBe(expectedHappiness);
    expect(updateCall.data.lastHappinessTickAt).toBeInstanceOf(Date);
    expect(result.happiness).toBe(expectedHappiness);
  });

  it('does not persist when happiness is unchanged (no elapsed time)', async () => {
    const now = new Date();

    prismaMock.childProfile.findUnique.mockResolvedValue({ id: CHILD_PROFILE_ID });
    prismaMock.creature.findUnique.mockResolvedValue({
      id: CREATURE_ID,
      childProfileId: CHILD_PROFILE_ID,
      species: CreatureSpecies.FOREST_PUP,
      name: 'Mossy',
      stage: EvolutionStage.BABY,
      happiness: 70,
      lastHappinessTickAt: now,
      pendingCareItems: [],
    });

    await service.getMine(USER_ID);

    expect(prismaMock.creature.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the creature has not been hatched', async () => {
    prismaMock.childProfile.findUnique.mockResolvedValue({ id: CHILD_PROFILE_ID });
    prismaMock.creature.findUnique.mockResolvedValue(null);

    await expect(service.getMine(USER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });
});
