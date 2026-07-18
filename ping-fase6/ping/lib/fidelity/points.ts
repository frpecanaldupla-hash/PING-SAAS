import type { FidelityConfig } from "@/lib/types";

export function fidelityProgress(points: number, config: FidelityConfig) {
  const remaining = Math.max(config.rewardThreshold - points, 0);
  const percent = Math.min((points / config.rewardThreshold) * 100, 100);
  const canRedeem = points >= config.rewardThreshold;
  return { remaining, percent, canRedeem };
}
