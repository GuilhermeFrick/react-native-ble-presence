import type { MatchingStrategy } from '../../types';

export const defaultMatchingStrategy: MatchingStrategy = {
  minScore: 35,
  weights: {
    beacon: 100,
    manufacturerData: 90,
    serviceData: 80,
    serviceUuids: 35,
    localName: 15,
    macAddress: 75,
    peripheralId: 50,
  },
};

