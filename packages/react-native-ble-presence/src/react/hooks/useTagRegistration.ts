import { useCallback } from 'react';
import { buildFingerprint } from '../../core/fingerprint/buildFingerprint';
import type { BleScanResult, RegisteredTag, SaveTagRegistrationInput, TagRegistrationResult } from '../../types';
import { useBlePresence } from './useBlePresence';

export type RegisterTagInput<TEntityId extends string = string> = {
  entityId: TEntityId;
  scanResult: BleScanResult;
  fingerprintId?: string;
};

export function useTagRegistration<TEntityId extends string = string>() {
  const { adapter, config, setRegisteredTags, state } = useBlePresence<TEntityId>();

  const registerTag = useCallback(
    async (input: RegisterTagInput<TEntityId>): Promise<TagRegistrationResult<TEntityId>> => {
      const fingerprint = buildFingerprint(input.scanResult, {
        id: input.fingerprintId,
        createdAt: config.clock?.(),
      });
      const payload: SaveTagRegistrationInput<TEntityId> = {
        entityId: input.entityId,
        fingerprint,
      };
      const registeredTag = await adapter.saveTagRegistration(payload);
      setRegisteredTags(upsertRegisteredTag(state.registeredTags, registeredTag));

      return {
        registeredTag,
        quality: registeredTag.fingerprint.quality,
      };
    },
    [adapter, config, setRegisteredTags, state.registeredTags],
  );

  return {
    nearbyTags: state.nearbyTags,
    registerTag,
  };
}

function upsertRegisteredTag<TEntityId extends string>(
  registeredTags: RegisteredTag<TEntityId>[],
  nextRegisteredTag: RegisteredTag<TEntityId>,
): RegisteredTag<TEntityId>[] {
  return [
    nextRegisteredTag,
    ...registeredTags.filter((registeredTag) => registeredTag.entityId !== nextRegisteredTag.entityId),
  ];
}
