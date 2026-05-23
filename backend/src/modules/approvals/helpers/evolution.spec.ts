import { EvolutionStage } from '@prisma/client';
import { computeEvolutionStage, isStageUpgrade } from './evolution';

describe('computeEvolutionStage', () => {
  it('returns EGG for 0 missions', () => {
    expect(computeEvolutionStage(0)).toBe(EvolutionStage.EGG);
  });

  it('returns EGG for 19 missions (just under BABY threshold)', () => {
    expect(computeEvolutionStage(19)).toBe(EvolutionStage.EGG);
  });

  it('returns BABY for exactly 20 missions', () => {
    expect(computeEvolutionStage(20)).toBe(EvolutionStage.BABY);
  });

  it('returns BABY for 59 missions (just under ADOLESCENT threshold)', () => {
    expect(computeEvolutionStage(59)).toBe(EvolutionStage.BABY);
  });

  it('returns ADOLESCENT for exactly 60 missions', () => {
    expect(computeEvolutionStage(60)).toBe(EvolutionStage.ADOLESCENT);
  });

  it('returns ADOLESCENT for 119 missions (just under ADULT threshold)', () => {
    expect(computeEvolutionStage(119)).toBe(EvolutionStage.ADOLESCENT);
  });

  it('returns ADULT for exactly 120 missions', () => {
    expect(computeEvolutionStage(120)).toBe(EvolutionStage.ADULT);
  });

  it('returns ADULT for 500 missions', () => {
    expect(computeEvolutionStage(500)).toBe(EvolutionStage.ADULT);
  });
});

describe('isStageUpgrade', () => {
  it('detects EGG → BABY as upgrade', () => {
    expect(isStageUpgrade(EvolutionStage.EGG, EvolutionStage.BABY)).toBe(true);
  });

  it('detects BABY → ADOLESCENT as upgrade', () => {
    expect(isStageUpgrade(EvolutionStage.BABY, EvolutionStage.ADOLESCENT)).toBe(true);
  });

  it('detects ADOLESCENT → ADULT as upgrade', () => {
    expect(isStageUpgrade(EvolutionStage.ADOLESCENT, EvolutionStage.ADULT)).toBe(true);
  });

  it('rejects same stage', () => {
    expect(isStageUpgrade(EvolutionStage.BABY, EvolutionStage.BABY)).toBe(false);
  });

  it('rejects regression', () => {
    expect(isStageUpgrade(EvolutionStage.ADULT, EvolutionStage.BABY)).toBe(false);
  });
});
