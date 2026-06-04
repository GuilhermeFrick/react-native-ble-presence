import { describe, expect, it } from 'vitest';
import { normalizeAdvertisementData } from '../encoding/normalizeAdvertisementData';
import { parseIBeacon } from './parseIBeacon';

const ibeaconHex = '4c000215e2c56db5dffb48d2b060d0f5a71096e0000a002dc5';

describe('parseIBeacon', () => {
  it('parses iBeacon manufacturer data from hex', () => {
    expect(parseIBeacon(ibeaconHex)).toEqual({
      type: 'ibeacon',
      uuid: 'e2c56db5-dffb-48d2-b060-d0f5a71096e0',
      major: 10,
      minor: 45,
    });
  });

  it('parses iBeacon manufacturer data normalized from base64', () => {
    const base64 = 'TAACFQAAAAAAAAAAAAAAAAAAAAAAAQAAxQ==';

    expect(parseIBeacon(normalizeAdvertisementData(base64))).toEqual({
      type: 'ibeacon',
      uuid: '00000000-0000-0000-0000-000000000000',
      major: 1,
      minor: 0,
    });
  });

  it('ignores non iBeacon manufacturer data', () => {
    expect(parseIBeacon('ffff00112233')).toBeUndefined();
  });
});
