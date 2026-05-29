// Reward thresholds config — persisted in localStorage so admin changes survive refresh.

const RewardConfig = (() => {
  "use strict";

  const STORAGE_KEY = "shopify_reward_config";

  const DEFAULTS = Object.freeze({
    freeShipping: {
      threshold: 3000,
      message: "Congratulations! You unlocked free shipping.",
      icon: "🚚",
      type: "free-shipping",
    },
    mysteryGift: {
      threshold: 5000,
      message: "You unlocked a mystery gift!",
      icon: "🎁",
      type: "mystery-gift",
    },
  });

  let _config = _load();
  const _listeners = new Set();

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };

      const parsed = JSON.parse(raw);

      // bail out if the saved data looks corrupted
      if (
        typeof parsed.freeShipping?.threshold !== "number" ||
        typeof parsed.mysteryGift?.threshold !== "number"
      ) {
        console.warn("Corrupted reward config, resetting to defaults");
        return { ...DEFAULTS };
      }

      return {
        freeShipping: { ...DEFAULTS.freeShipping, ...parsed.freeShipping },
        mysteryGift: { ...DEFAULTS.mysteryGift, ...parsed.mysteryGift },
      };
    } catch (err) {
      console.error("Failed to load reward config:", err);
      return { ...DEFAULTS };
    }
  }

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_config));
    } catch (err) {
      console.error("Failed to save reward config:", err);
    }
  }

  function _notify() {
    _listeners.forEach((fn) => {
      try { fn(_config); } catch (err) { console.error("Config listener error:", err); }
    });
  }

  return Object.freeze({
    get() {
      return JSON.parse(JSON.stringify(_config));
    },

    update(updates) {
      try {
        if (updates.freeShipping !== undefined) {
          const val = Number(updates.freeShipping);
          if (isNaN(val) || val < 0) throw new Error("Invalid freeShipping threshold");
          _config.freeShipping.threshold = val;
        }
        if (updates.mysteryGift !== undefined) {
          const val = Number(updates.mysteryGift);
          if (isNaN(val) || val < 0) throw new Error("Invalid mysteryGift threshold");
          _config.mysteryGift.threshold = val;
        }
        _save();
        _notify();
        return true;
      } catch (err) {
        console.error("Config update failed:", err);
        return false;
      }
    },

    reset() {
      _config = { ...DEFAULTS };
      _save();
      _notify();
    },

    onChange(fn) {
      _listeners.add(fn);
      return () => _listeners.delete(fn);
    },

    DEFAULTS,
  });
})();
