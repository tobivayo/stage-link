import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { BandsService } from './bands.service';

describe('BandsService membership rules', () => {
  const ownerUserId = '8370911f-b4c7-4286-9e78-b84a81df3c38';
  const bandId = '28c4b8b1-9c68-4e2e-bec1-a54cda8ebf67';

  it('does not allow removing the sole administrator', async () => {
    const prisma = {
      bandProject: { findFirst: vi.fn().mockResolvedValue({ id: bandId, ownerUserId }) },
      bandMember: {
        findFirst: vi.fn().mockResolvedValue({ id: 'member-id', userId: ownerUserId }),
      },
    };
    const service = new BandsService(prisma as never);

    await expect(service.removeMember(ownerUserId, bandId, 'member-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires exactly one invitation recipient', async () => {
    const prisma = {
      bandProject: { findFirst: vi.fn().mockResolvedValue({ id: bandId, ownerUserId }) },
    };
    const service = new BandsService(prisma as never);

    await expect(
      service.invite(ownerUserId, bandId, {
        userId: 'cae5e775-e647-48e0-b6c8-ebc7c2aa0984',
        email: 'member@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
