import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { MemberSearchesService } from './member-searches.service';

describe('MemberSearchesService ownership', () => {
  it('rejects publication for a band not administered by the user', async () => {
    const prisma = { bandProject: { findFirst: vi.fn().mockResolvedValue(null) } };
    const service = new MemberSearchesService(prisma as never);

    await expect(
      service.create('8370911f-b4c7-4286-9e78-b84a81df3c38', {
        bandProjectId: '28c4b8b1-9c68-4e2e-bec1-a54cda8ebf67',
        title: 'Buscamos bajista',
        description: 'Proyecto activo con material propio',
        requiredInstrument: 'Bajo',
        genres: ['Rock'],
        modality: 'IN_PERSON',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires an active solo profile for an individual publication', async () => {
    const prisma = { musicianProfile: { findFirst: vi.fn().mockResolvedValue(null) } };
    const service = new MemberSearchesService(prisma as never);

    await expect(
      service.create('8370911f-b4c7-4286-9e78-b84a81df3c38', {
        title: 'Busco baterista',
        description: 'Proyecto individual con repertorio propio',
        requiredInstrument: 'Batería',
        genres: ['Rock'],
        modality: 'HYBRID',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
