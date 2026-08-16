/** Internal balance uses the same server units as before (100000 score ≈ 100 GP). */
export const POINTS_PER_BALANCE_UNIT = 100;

export function balanceToPoints(balance: number): number {
  return Math.round(balance * POINTS_PER_BALANCE_UNIT);
}

export function formatPoints(balance: number, compact = false): string {
  const points = balanceToPoints(balance);
  if (compact && points >= 1000) {
    return `${(points / 1000).toFixed(points >= 10000 ? 0 : 1)}K GP`;
  }
  return `${points.toLocaleString()} GP`;
}

export function rewardToPoints(rewardBalance: number): number {
  return balanceToPoints(rewardBalance);
}

export type EmpireRank = {
  id: string;
  name: string;
  minPoints: number;
  tagline: string;
};

export const EMPIRE_RANKS: EmpireRank[] = [
  { id: "recruit", name: "Recruit", minPoints: 0, tagline: "Fresh to the arcade empire" },
  { id: "soldier", name: "Soldier", minPoints: 100, tagline: "Proving yourself in the zones" },
  { id: "captain", name: "Captain", minPoints: 500, tagline: "A trusted arcade commander" },
  { id: "baron", name: "Gold Baron", minPoints: 1500, tagline: "Elite status across the empire" },
  { id: "king", name: "Empire King", minPoints: 5000, tagline: "Legend of Play 'n Payday" },
];

export type EmpirePerk = {
  id: string;
  name: string;
  cost: number;
  description: string;
};

export const EMPIRE_PERKS: EmpirePerk[] = [
  {
    id: "gold_frame",
    name: "Gold Profile Frame",
    cost: 250,
    description: "Show off your empire status on the leaderboard.",
  },
  {
    id: "elite_badge",
    name: "Elite Zone Badge",
    cost: 500,
    description: "Unlock the ELITE tag on your favorite arcade zones.",
  },
  {
    id: "crown_flair",
    name: "Hall of Fame Crown",
    cost: 1000,
    description: "Crown flair beside your empire name in the lobby.",
  },
  {
    id: "vip_theme",
    name: "VIP Empire Theme",
    cost: 2500,
    description: "Premium gold lobby styling reserved for top players.",
  },
];

export function getEmpireRank(points: number): EmpireRank {
  return [...EMPIRE_RANKS].reverse().find((rank) => points >= rank.minPoints) ?? EMPIRE_RANKS[0];
}

export function getNextEmpireRank(points: number): EmpireRank | null {
  return EMPIRE_RANKS.find((rank) => points < rank.minPoints) ?? null;
}

export function getRankProgress(points: number): number {
  const current = getEmpireRank(points);
  const next = getNextEmpireRank(points);
  if (!next) return 100;

  const span = next.minPoints - current.minPoints;
  const progress = points - current.minPoints;
  return Math.min(100, Math.round((progress / span) * 100));
}

export function isPerkUnlocked(points: number, perk: EmpirePerk): boolean {
  return points >= perk.cost;
}
