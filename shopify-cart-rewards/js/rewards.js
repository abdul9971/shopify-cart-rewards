// Rewards evaluation engine.
// Pure logic — no DOM access. Takes a subtotal, checks it against
// the configured thresholds, and returns reward status objects.

const RewardsEngine = (() => {
  "use strict";

  function evaluate(subtotal, config) {
    try {
      const cfg = config || RewardConfig.get();
      const total = Math.max(0, Number(subtotal) || 0);

      // sort by threshold so lower tiers come first
      const tiers = [
        { ...cfg.freeShipping },
        { ...cfg.mysteryGift },
      ].sort((a, b) => a.threshold - b.threshold);

      return tiers.map((tier) => {
        const unlocked = total > tier.threshold;
        const progress = tier.threshold > 0 ? Math.min(1, total / tier.threshold) : 1;
        const remaining = unlocked ? 0 : tier.threshold - total;

        return {
          type: tier.type,
          icon: tier.icon,
          message: tier.message,
          threshold: tier.threshold,
          unlocked,
          progress,
          remaining,
        };
      });
    } catch (err) {
      console.error("Reward evaluation failed:", err);
      return [];
    }
  }

  function getUnlocked(subtotal) {
    return evaluate(subtotal).filter((r) => r.unlocked);
  }

  function getNextReward(subtotal) {
    return evaluate(subtotal).find((r) => !r.unlocked) || null;
  }

  return Object.freeze({ evaluate, getUnlocked, getNextReward });
})();
