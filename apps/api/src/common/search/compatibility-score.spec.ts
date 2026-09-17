import { describe, expect, it } from 'vitest';

import { calculateCompatibility } from './compatibility-score';

describe('calculateCompatibility', () => {
  it('returns an explainable score for shared criteria', () => {
    const result = calculateCompatibility(
      {
        genres: ['rock'],
        instruments: ['bass'],
        influences: ['spinetta'],
        locationText: 'Rosario',
        requiresAvailability: true,
        desiredExperience: 'ADVANCED',
      },
      {
        genres: ['rock'],
        instruments: ['bass'],
        influences: ['spinetta'],
        locationText: 'rosario',
        availableForProjects: true,
        experienceLevel: 'ADVANCED',
      },
    );

    expect(result.score).toBe(100);
    expect(result.reasons).toContain('Misma zona');
  });

  it('does not award unavailable or unrelated profiles', () => {
    expect(
      calculateCompatibility(
        { genres: ['jazz'], instruments: ['piano'], influences: [], requiresAvailability: true },
        {
          genres: ['metal'],
          instruments: ['drums'],
          influences: [],
          availableForProjects: false,
        },
      ).score,
    ).toBe(0);
  });
});
