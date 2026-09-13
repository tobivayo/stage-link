import { describe, expect, it, vi } from 'vitest';

import { ProfilesService } from './profiles.service';

const musician = {
  id: '28c4b8b1-9c68-4e2e-bec1-a54cda8ebf67',
  userId: '8370911f-b4c7-4286-9e78-b84a81df3c38',
  stageName: 'Luna',
  bio: 'Bajista',
  instruments: ['bajo'],
  genres: ['rock'],
  influences: ['Spinetta'],
  experience: 'Diez años',
  previousProjects: [],
  availableForProjects: true,
  isSoloProject: true,
  locationText: 'Rosario centro',
  city: null,
  countryCode: null,
  photoUrl: null,
  visibility: 'PUBLIC',
  locationVisibility: 'REGISTERED_ONLY',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  user: { firstName: 'Luna', lastName: 'Paz' },
  links: [
    { label: 'Sitio', url: 'https://example.com', visibility: 'PUBLIC' },
    { label: 'Demo privado', url: 'https://example.com/private', visibility: 'PRIVATE' },
  ],
};

describe('ProfilesService privacy', () => {
  it('returns only public fields and links to a visitor', async () => {
    const prisma = { musicianProfile: { findFirst: vi.fn().mockResolvedValue(musician) } };
    const service = new ProfilesService(prisma as never);

    const result = await service.getVisibleProfile('musician', musician.id, null);

    expect(result.view).toBe('PUBLIC');
    expect(result.locationText).toBeUndefined();
    expect(result.influences).toBeUndefined();
    expect(result.links).toHaveLength(1);
  });

  it('returns registered-only location to an authenticated viewer', async () => {
    const prisma = { musicianProfile: { findFirst: vi.fn().mockResolvedValue(musician) } };
    const service = new ProfilesService(prisma as never);

    const result = await service.getVisibleProfile(
      'musician',
      musician.id,
      'cae5e775-e647-48e0-b6c8-ebc7c2aa0984',
    );

    expect(result.view).toBe('REGISTERED');
    expect(result.locationText).toBe('Rosario centro');
    expect(result.influences).toEqual(['Spinetta']);
  });
});
