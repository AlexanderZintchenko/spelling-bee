import type { ClassicStats, XpStats } from "../types/stats.types";

/**
 * Merge any leftover old individually-keyed stats into the new classicStats/xpStats,
 * keeping whichever value is larger. Safe to call on every load.
 */
export function migrateOldStats(classicStats: ClassicStats, xpStats: XpStats) {
  const oldNumber = (key: string) =>
    Number(JSON.parse(localStorage.getItem(key) ?? "0"));

  const mergedClassicStats: ClassicStats = {
    streakCounter: classicStats.streakCounter, // no migration
    bestStreakCounter: Math.max(
      classicStats.bestStreakCounter,
      oldNumber("bestStreakCounter"),
    ),
    correctCounter: Math.max(
      classicStats.correctCounter,
      oldNumber("correctCounter"),
    ),
    falseCounter: Math.max(
      classicStats.falseCounter,
      oldNumber("falseCounter"),
    ),
    lastFalseWord: classicStats.lastFalseWord,
  };

  const mergedXpStats: XpStats = {
    xp: Math.max(xpStats.xp, oldNumber("xp")),
    streakCounter: xpStats.streakCounter, // no migration
    bestStreakCounter: xpStats.bestStreakCounter,
    correctCounter: xpStats.correctCounter,
    falseCounter: xpStats.falseCounter,
    lastFalseWord: xpStats.lastFalseWord,
  };

  return { mergedClassicStats, mergedXpStats };
}
