import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { CallSelectionService } from './call-selection.service';

describe('CallSelectionService limits', () => {
  it('rejects a selection above the configured slots', async () => {
    const callId = '28c4b8b1-9c68-4e2e-bec1-a54cda8ebf67';
    const applications = [
      { id: '26cf9519-f16d-42b3-93ce-ad259cf12844', status: 'PENDING', submittedByUserId: 'u1' },
      {
        id: 'd1f174f0-a8fc-49b4-aeb2-4fd526d03d3e',
        status: 'PRESELECTED',
        submittedByUserId: 'u2',
      },
    ];
    const transaction = {
      application: {
        findMany: vi.fn().mockResolvedValue(applications),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(transaction)),
    };
    const calls = {
      requireOwner: vi.fn().mockResolvedValue({
        id: callId,
        status: 'OPEN',
        maxSelectedApplicants: 1,
      }),
    };
    const service = new CallSelectionService(prisma as never, calls as never);

    await expect(
      service.select('8370911f-b4c7-4286-9e78-b84a81df3c38', callId, {
        applicationIds: applications.map((application) => application.id),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
