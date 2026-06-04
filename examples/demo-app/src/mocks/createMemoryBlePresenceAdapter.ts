import type {
  BlePresenceAdapter,
  PresenceEvent,
  RegisteredTag,
  SaveTagRegistrationInput,
} from '@guilhermefrick/react-native-ble-presence';

export function createMemoryBlePresenceAdapter(): BlePresenceAdapter {
  let registeredTags: RegisteredTag[] = [];
  const events: PresenceEvent[] = [];

  return {
    async getRegisteredTags() {
      return registeredTags;
    },
    async saveTagRegistration(input: SaveTagRegistrationInput) {
      const registeredTag: RegisteredTag = {
        entityId: input.entityId,
        fingerprint: input.fingerprint,
        metadata: {
          source: 'demo-memory-adapter',
        },
      };

      registeredTags = [
        registeredTag,
        ...registeredTags.filter((tag) => tag.entityId !== registeredTag.entityId),
      ];

      return registeredTag;
    },
    async reportPresenceEvent(event: PresenceEvent) {
      events.push(event);
    },
  };
}

