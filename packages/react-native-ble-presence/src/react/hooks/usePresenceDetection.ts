import { useCallback, useEffect, useRef } from 'react';
import { matchPresence } from '../../core/matching/matchPresence';
import type { PresenceMatch } from '../../types';
import { useBlePresence } from './useBlePresence';

export function usePresenceDetection<TEntityId extends string = string>() {
  const { adapter, config, setCurrentMatch, setRegisteredTags, state } = useBlePresence<TEntityId>();
  const lastReportedEntityIdRef = useRef<TEntityId | null>(null);

  const refreshRegisteredTags = useCallback(async () => {
    const registeredTags = await adapter.getRegisteredTags();
    setRegisteredTags(registeredTags);
    return registeredTags;
  }, [adapter, setRegisteredTags]);

  useEffect(() => {
    const latestScanResult = state.nearbyTags[0];

    if (!latestScanResult || state.registeredTags.length === 0) {
      return;
    }

    const match = matchPresence<TEntityId>(latestScanResult, state.registeredTags, {
      strategy: config.matchingStrategy,
    });

    if (!sameMatch(state.currentMatch as PresenceMatch<TEntityId> | null, match)) {
      setCurrentMatch(match);
    }

    if (!match || lastReportedEntityIdRef.current === match.entityId) {
      return;
    }

    lastReportedEntityIdRef.current = match.entityId;
    void adapter.reportPresenceEvent?.({
      type: 'matched',
      entityId: match.entityId,
      match,
      occurredAt: config.clock?.() ?? new Date().toISOString(),
    });
  }, [adapter, config, setCurrentMatch, state.nearbyTags, state.registeredTags]);

  return {
    currentMatch: state.currentMatch as PresenceMatch<TEntityId> | null,
    refreshRegisteredTags,
    registeredTags: state.registeredTags,
  };
}

function sameMatch<TEntityId extends string>(
  currentMatch: PresenceMatch<TEntityId> | null,
  nextMatch: PresenceMatch<TEntityId> | null,
): boolean {
  if (!currentMatch && !nextMatch) {
    return true;
  }

  if (!currentMatch || !nextMatch) {
    return false;
  }

  return (
    currentMatch.entityId === nextMatch.entityId &&
    currentMatch.score === nextMatch.score &&
    currentMatch.confidence === nextMatch.confidence &&
    currentMatch.matchedBy.join('|') === nextMatch.matchedBy.join('|')
  );
}
