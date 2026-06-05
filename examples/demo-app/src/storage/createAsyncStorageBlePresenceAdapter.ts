import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BlePresenceAdapter,
  PresenceEvent,
  RegisteredTag,
  SaveTagRegistrationInput,
} from '@guilhermefrick/react-native-ble-presence';

const registeredTagsKey = '@ble-presence-demo/registered-tags';
const presenceEventsKey = '@ble-presence-demo/presence-events';

export function createAsyncStorageBlePresenceAdapter(): BlePresenceAdapter {
  return {
    async getRegisteredTags() {
      return readJson<RegisteredTag[]>(registeredTagsKey, []);
    },
    async saveTagRegistration(input: SaveTagRegistrationInput) {
      const registeredTags = await readJson<RegisteredTag[]>(registeredTagsKey, []);
      const registeredTag: RegisteredTag = {
        entityId: input.entityId,
        fingerprint: input.fingerprint,
        metadata: {
          source: 'demo-async-storage-adapter',
          storedAt: new Date().toISOString(),
        },
      };

      const nextRegisteredTags = [
        registeredTag,
        ...registeredTags.filter((tag) => tag.entityId !== registeredTag.entityId),
      ];

      await AsyncStorage.setItem(registeredTagsKey, JSON.stringify(nextRegisteredTags));

      return registeredTag;
    },
    async reportPresenceEvent(event: PresenceEvent) {
      const events = await readJson<PresenceEvent[]>(presenceEventsKey, []);
      const nextEvents = [event, ...events].slice(0, 50);

      await AsyncStorage.setItem(presenceEventsKey, JSON.stringify(nextEvents));
    },
  };
}

export async function deleteStoredTagRegistration(entityId: string): Promise<void> {
  const registeredTags = await readJson<RegisteredTag[]>(registeredTagsKey, []);
  const nextRegisteredTags = registeredTags.filter((tag) => tag.entityId !== entityId);

  await AsyncStorage.setItem(registeredTagsKey, JSON.stringify(nextRegisteredTags));
}

async function readJson<TValue>(key: string, fallback: TValue): Promise<TValue> {
  const rawValue = await AsyncStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as TValue;
  } catch {
    return fallback;
  }
}
