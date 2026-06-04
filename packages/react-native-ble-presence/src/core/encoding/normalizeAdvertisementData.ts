export function normalizeAdvertisementData(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const hexValue = normalizeHexLike(value);

  if (hexValue) {
    return hexValue;
  }

  return decodeBase64ToHex(value);
}

function normalizeHexLike(value: string): string | undefined {
  const normalized = value.replace(/[^a-fA-F0-9]/g, '').toLowerCase();

  if (normalized.length === 0 || normalized.length % 2 !== 0) {
    return undefined;
  }

  return normalized;
}

function decodeBase64ToHex(value: string): string | undefined {
  const sanitized = value.replace(/\s/g, '');

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(sanitized)) {
    return undefined;
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];

  for (let index = 0; index < sanitized.length; index += 4) {
    const chunk = sanitized.slice(index, index + 4);

    if (chunk.length < 4) {
      return undefined;
    }

    const values = [...chunk].map((character) => (character === '=' ? 0 : alphabet.indexOf(character)));

    if (values.some((number) => number < 0)) {
      return undefined;
    }

    const [first = 0, second = 0, third = 0, fourth = 0] = values;
    const combined = (first << 18) | (second << 12) | (third << 6) | fourth;

    bytes.push((combined >> 16) & 0xff);

    if (chunk[2] !== '=') {
      bytes.push((combined >> 8) & 0xff);
    }

    if (chunk[3] !== '=') {
      bytes.push(combined & 0xff);
    }
  }

  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

