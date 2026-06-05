import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultPresenceRules,
  type PresenceRulesConfig,
} from './usePresenceRules';

const rulesStorageKey = '@ble-presence-demo/presence-rules';

export function usePresenceRuleSettings() {
  const [rules, setRules] = useState<PresenceRulesConfig>(defaultPresenceRules);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadRules() {
      const storedRules = await readStoredRules();

      if (!mounted) {
        return;
      }

      setRules(storedRules);
      setIsLoaded(true);
    }

    void loadRules();

    return () => {
      mounted = false;
    };
  }, []);

  const updateRules = useCallback((patch: Partial<PresenceRulesConfig>) => {
    setRules((currentRules) => {
      const nextRules = normalizeRules({
        ...currentRules,
        ...patch,
      });

      void AsyncStorage.setItem(rulesStorageKey, JSON.stringify(nextRules));

      return nextRules;
    });
  }, []);

  const resetRules = useCallback(() => {
    setRules(defaultPresenceRules);
    void AsyncStorage.setItem(rulesStorageKey, JSON.stringify(defaultPresenceRules));
  }, []);

  return {
    isLoaded,
    resetRules,
    rules,
    updateRules,
  };
}

async function readStoredRules(): Promise<PresenceRulesConfig> {
  const rawValue = await AsyncStorage.getItem(rulesStorageKey);

  if (!rawValue) {
    return defaultPresenceRules;
  }

  try {
    return normalizeRules({
      ...defaultPresenceRules,
      ...(JSON.parse(rawValue) as Partial<PresenceRulesConfig>),
    });
  } catch {
    return defaultPresenceRules;
  }
}

function normalizeRules(rules: PresenceRulesConfig): PresenceRulesConfig {
  return {
    enterWindowMs: clamp(roundToStep(rules.enterWindowMs, 1000), 3000, 60000),
    lostAfterMs: clamp(roundToStep(rules.lostAfterMs, 1000), 5000, 300000),
    minDetectionsToEnter: clamp(Math.round(rules.minDetectionsToEnter), 1, 20),
    minRssi: clamp(Math.round(rules.minRssi), -100, -40),
    minSpeedToConfirmKmh: clamp(Math.round(rules.minSpeedToConfirmKmh), 0, 120),
    requireMovementToEnter: Boolean(rules.requireMovementToEnter),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}
