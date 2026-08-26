export type ClassicStats = {
  streakCounter: number;
  bestStreakCounter: number;
  correctCounter: number;
  falseCounter: number;
  lastFalseWord: string;
};

export const DEFAULT_CLASSIC_STATS: ClassicStats = {
  streakCounter: 0,
  bestStreakCounter: 0,
  correctCounter: 0,
  falseCounter: 0,
  lastFalseWord: "-",
};

export type XpStats = {
  streakCounter: number;
  bestStreakCounter: number;
  correctCounter: number;
  falseCounter: number;
  lastFalseWord: string;
  xp: number;
};

export const DEFAULT_XP_STATS: XpStats = {
  streakCounter: 0,
  bestStreakCounter: 0,
  correctCounter: 0,
  falseCounter: 0,
  lastFalseWord: "-",
  xp: 0,
};
