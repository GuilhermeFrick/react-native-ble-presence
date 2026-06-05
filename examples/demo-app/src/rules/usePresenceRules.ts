import { useEffect, useMemo, useRef, useState } from 'react';
import type { BleScanResult, PresenceMatch } from '@guilhermefrick/react-native-ble-presence';

export type PresenceRulesConfig = {
  enterWindowMs: number;
  lostAfterMs: number;
  minDetectionsToEnter: number;
  minRssi: number;
  minSpeedToConfirmKmh: number;
  requireMovementToEnter: boolean;
  useEnterWindow: boolean;
  useLostAfter: boolean;
  useMinDetectionsToEnter: boolean;
  useMinRssi: boolean;
};

export type RulePresenceStatus = 'idle' | 'candidate' | 'confirmed' | 'lost_pending';

export type RulePresenceState<TEntityId extends string = string> = {
  candidateDetections: number;
  candidateEntityId: TEntityId | null;
  confirmedMatch: PresenceMatch<TEntityId> | null;
  lastSeenAt: string | null;
  reason: string;
  status: RulePresenceStatus;
};

type Candidate<TEntityId extends string> = {
  count: number;
  entityId: TEntityId;
  firstSeenAtMs: number;
  lastSeenAtMs: number;
};

export const defaultPresenceRules: PresenceRulesConfig = {
  enterWindowMs: 10000,
  lostAfterMs: 30000,
  minDetectionsToEnter: 3,
  minRssi: -85,
  minSpeedToConfirmKmh: 8,
  requireMovementToEnter: true,
  useEnterWindow: true,
  useLostAfter: true,
  useMinDetectionsToEnter: true,
  useMinRssi: true,
};

export function usePresenceRules<TEntityId extends string = string>({
  latestTag,
  rawMatch,
  rules = defaultPresenceRules,
  speedKmh,
}: {
  latestTag: BleScanResult | null;
  rawMatch: PresenceMatch<TEntityId> | null;
  rules?: PresenceRulesConfig;
  speedKmh: number | null;
}) {
  const candidateRef = useRef<Candidate<TEntityId> | null>(null);
  const confirmedRef = useRef<PresenceMatch<TEntityId> | null>(null);
  const lastProcessedSeenAtRef = useRef<string | null>(null);
  const [state, setState] = useState<RulePresenceState<TEntityId>>(() => createInitialState());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const latestSeenAt = latestTag?.seenAt ?? null;

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const hasNewAdvertisement = Boolean(latestSeenAt && latestSeenAt !== lastProcessedSeenAtRef.current);
    const passesRssi = !rules.useMinRssi || latestTag?.rssi == null || latestTag.rssi >= rules.minRssi;

    if (rawMatch && latestTag && passesRssi && hasNewAdvertisement) {
      lastProcessedSeenAtRef.current = latestTag.seenAt;
      const candidate = buildNextCandidate(candidateRef.current, rawMatch.entityId, nowMs, rules);
      candidateRef.current = candidate;

      const hasEnoughDetections = passesMinDetections(candidate.count, rules);
      const hasMovement = passesMovement(speedKmh, rules);

      if (hasEnoughDetections && hasMovement) {
        confirmedRef.current = rawMatch;
        setState({
          candidateDetections: candidate.count,
          candidateEntityId: candidate.entityId,
          confirmedMatch: rawMatch,
          lastSeenAt: latestTag.seenAt,
          reason: 'Presenca confirmada por BLE e regras',
          status: 'confirmed',
        });
        return;
      }

      setState({
        candidateDetections: candidate.count,
        candidateEntityId: candidate.entityId,
        confirmedMatch: confirmedRef.current,
        lastSeenAt: latestTag.seenAt,
        reason: buildCandidateReason(hasEnoughDetections, hasMovement, speedKmh, rules),
        status: confirmedRef.current ? 'lost_pending' : 'candidate',
      });
      return;
    }

    const confirmedMatch = confirmedRef.current;
    const candidate = candidateRef.current;

    if (!confirmedMatch && candidate) {
      const candidateAgeMs = nowMs - candidate.firstSeenAtMs;

      if (!rules.useEnterWindow || candidateAgeMs <= rules.enterWindowMs) {
        const hasEnoughDetections = passesMinDetections(candidate.count, rules);
        const hasMovement = passesMovement(speedKmh, rules);

        setState({
          candidateDetections: candidate.count,
          candidateEntityId: candidate.entityId,
          confirmedMatch: null,
          lastSeenAt: new Date(candidate.lastSeenAtMs).toISOString(),
          reason: buildCandidateReason(hasEnoughDetections, hasMovement, speedKmh, rules),
          status: 'candidate',
        });
        return;
      }

      candidateRef.current = null;
    }

    if (confirmedMatch && candidateRef.current) {
      const elapsedWithoutMatchMs = nowMs - candidateRef.current.lastSeenAtMs;

      if (!rules.useLostAfter || elapsedWithoutMatchMs < rules.lostAfterMs) {
        setState({
          candidateDetections: candidateRef.current.count,
          candidateEntityId: candidateRef.current.entityId,
          confirmedMatch,
          lastSeenAt: new Date(candidateRef.current.lastSeenAtMs).toISOString(),
          reason: 'Aguardando novo advertisement antes de perder presenca',
          status: 'lost_pending',
        });
        return;
      }
    }

    if (confirmedMatch) {
      confirmedRef.current = null;
      candidateRef.current = null;
      setState({
        candidateDetections: 0,
        candidateEntityId: null,
        confirmedMatch: null,
        lastSeenAt: null,
        reason: 'Presenca perdida por timeout BLE',
        status: 'idle',
      });
      return;
    }

    candidateRef.current = null;
    setState({
      ...createInitialState<TEntityId>(),
      reason: passesRssi ? 'Aguardando match BLE' : 'RSSI abaixo do minimo configurado',
    });
  }, [latestSeenAt, latestTag, nowMs, rawMatch, rules, speedKmh]);

  const ruleSummary = useMemo(
    () => [
      rules.useMinDetectionsToEnter
        ? `${rules.minDetectionsToEnter} deteccoes`
        : 'deteccoes desligadas',
      rules.useEnterWindow
        ? `janela ${Math.round(rules.enterWindowMs / 1000)}s`
        : 'janela desligada',
      rules.useLostAfter ? `perde em ${Math.round(rules.lostAfterMs / 1000)}s` : 'perda desligada',
      rules.useMinRssi ? `RSSI >= ${rules.minRssi}` : 'RSSI desligado',
      rules.requireMovementToEnter ? `GPS >= ${rules.minSpeedToConfirmKmh} km/h` : 'GPS opcional',
    ],
    [rules],
  );

  return {
    ...state,
    rules,
    ruleSummary,
  };
}

function createInitialState<TEntityId extends string>(): RulePresenceState<TEntityId> {
  return {
    candidateDetections: 0,
    candidateEntityId: null,
    confirmedMatch: null,
    lastSeenAt: null,
    reason: 'Aguardando match BLE',
    status: 'idle',
  };
}

function buildNextCandidate<TEntityId extends string>(
  currentCandidate: Candidate<TEntityId> | null,
  entityId: TEntityId,
  nowMs: number,
  rules: PresenceRulesConfig,
): Candidate<TEntityId> {
  const sameCandidate = currentCandidate?.entityId === entityId;
  const insideWindow = currentCandidate
    ? !rules.useEnterWindow || nowMs - currentCandidate.firstSeenAtMs <= rules.enterWindowMs
    : false;

  if (!currentCandidate || !sameCandidate || !insideWindow) {
    return {
      count: 1,
      entityId,
      firstSeenAtMs: nowMs,
      lastSeenAtMs: nowMs,
    };
  }

  return {
    ...currentCandidate,
    count: currentCandidate.count + 1,
    lastSeenAtMs: nowMs,
  };
}

function buildCandidateReason(
  hasEnoughDetections: boolean,
  hasMovement: boolean,
  speedKmh: number | null,
  rules: PresenceRulesConfig,
): string {
  if (!hasEnoughDetections) {
    return 'Aguardando mais deteccoes BLE dentro da janela';
  }

  if (!hasMovement) {
    const speedLabel = typeof speedKmh === 'number' ? `${speedKmh.toFixed(1)} km/h` : 'sem fix GPS';
    return `Aguardando movimento minimo: ${speedLabel} de ${rules.minSpeedToConfirmKmh} km/h`;
  }

  return 'Regras atendidas';
}

function passesMinDetections(count: number, rules: PresenceRulesConfig): boolean {
  return !rules.useMinDetectionsToEnter || count >= rules.minDetectionsToEnter;
}

function passesMovement(speedKmh: number | null, rules: PresenceRulesConfig): boolean {
  return (
    !rules.requireMovementToEnter ||
    (typeof speedKmh === 'number' && speedKmh >= rules.minSpeedToConfirmKmh)
  );
}
