/**
 * Calculate XP required to reach a level using exponential formula
 * Formula: baseXP * (level ^ exponent)
 */
export function calculateXpForLevel(level: number, baseXp = 100, exponent = 1.5): number {
  if (level <= 1) return 0;
  return Math.floor(baseXp * Math.pow(level - 1, exponent));
}

/**
 * Calculate total XP accumulated through all levels
 */
export function calculateTotalXpForLevel(level: number, baseXp = 100, exponent = 1.5): number {
  let totalXp = 0;
  for (let i = 2; i <= level; i++) {
    totalXp += calculateXpForLevel(i, baseXp, exponent);
  }
  return totalXp;
}

/**
 * Calculate current level from total XP
 */
export function calculateLevelFromXp(totalXp: number, baseXp = 100, exponent = 1.5): number {
  let level = 1;
  let accumulatedXp = 0;

  while (true) {
    const xpForNextLevel = calculateXpForLevel(level + 1, baseXp, exponent);
    if (accumulatedXp + xpForNextLevel > totalXp) {
      break;
    }
    accumulatedXp += xpForNextLevel;
    level++;
  }

  return level;
}

/**
 * Calculate XP progress within current level
 */
export function calculateLevelProgress(
  totalXp: number,
  baseXp = 100,
  exponent = 1.5,
): { level: number; currentXp: number; xpForNextLevel: number; progress: number } {
  const level = calculateLevelFromXp(totalXp, baseXp, exponent);
  const xpForCurrentLevel = calculateTotalXpForLevel(level, baseXp, exponent);
  const currentXp = totalXp - xpForCurrentLevel;
  const xpForNextLevel = calculateXpForLevel(level + 1, baseXp, exponent);
  const progress = xpForNextLevel > 0 ? currentXp / xpForNextLevel : 1;

  return {
    level,
    currentXp,
    xpForNextLevel,
    progress: Math.min(progress, 1),
  };
}

// Level thresholds for quick reference (using default exponential formula)
export const LEVEL_THRESHOLDS = [
  { level: 1, totalXp: 0 },
  { level: 2, totalXp: 100 },
  { level: 3, totalXp: 282 },
  { level: 4, totalXp: 552 },
  { level: 5, totalXp: 900 },
  { level: 6, totalXp: 1324 },
  { level: 7, totalXp: 1820 },
  { level: 8, totalXp: 2385 },
  { level: 9, totalXp: 3017 },
  { level: 10, totalXp: 3714 },
];
