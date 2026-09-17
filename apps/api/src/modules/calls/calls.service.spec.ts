import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { CallStatus } from '../../generated/prisma/enums';
import { CallsService } from './calls.service';

describe('CallsService rules', () => {
  const userId = '8370911f-b4c7-4286-9e78-b84a81df3c38';
  const callId = '28c4b8b1-9c68-4e2e-bec1-a54cda8ebf67';

  it('rejects a band organizer not owned by the user', async () => {
    const prisma = { bandProject: { findFirst: vi.fn().mockResolvedValue(null) } };
    const service = new CallsService(prisma as never);

    await expect(
      service.create(userId, {
        organizerType: 'BAND_PROJECT',
        bandProjectId: callId,
        type: 'FESTIVAL',
        title: 'Festival independiente',
        description: 'Convocatoria para una fecha musical independiente.',
        proposedDateTime: '2027-01-20T22:00:00.000Z',
        genres: ['rock'],
        maxSelectedApplicants: 2,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not edit a completed call', async () => {
    const prisma = {
      call: {
        findFirst: vi.fn().mockResolvedValue({
          id: callId,
          creatorUserId: userId,
          status: CallStatus.COMPLETED,
        }),
      },
    };
    const service = new CallsService(prisma as never);

    await expect(service.update(userId, callId, { title: 'Nuevo título' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
