import 'reflect-metadata';

import { describe, expect, it, vi } from 'vitest';

import { Visibility } from '../../generated/prisma/enums';
import { MusicianSearchSort } from './dto/search-musicians.dto';
import { MusicianSearchService } from './musician-search.service';

describe('MusicianSearchService', () => {
  it('limits anonymous searches to public active profiles', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      musicianProfile: { count: vi.fn().mockResolvedValue(0), findMany },
    };
    const service = new MusicianSearchService(prisma as never, {} as never);

    await service.search({ page: 1, limit: 20, sort: MusicianSearchSort.RECENT }, null);

    const call = findMany.mock.calls[0]?.[0] as unknown as {
      take: number;
      where: { visibility: Visibility; status: string };
    };
    expect(call.take).toBe(200);
    expect(call.where.visibility).toBe(Visibility.PUBLIC);
    expect(call.where.status).toBe('ACTIVE');
  });

  it('normalizes exact array filters', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      musicianProfile: { count: vi.fn().mockResolvedValue(0), findMany },
    };
    const service = new MusicianSearchService(prisma as never, {} as never);

    await service.search(
      { page: 1, limit: 20, sort: MusicianSearchSort.COMPATIBILITY, instrument: ' Bajo ' },
      '8370911f-b4c7-4286-9e78-b84a81df3c38',
    );

    const call = findMany.mock.calls[0]?.[0] as unknown as {
      where: { instruments: { has: string } };
    };
    expect(call.where.instruments.has).toBe('bajo');
  });

  it('does not let anonymous filters infer registered-only fields', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      musicianProfile: { count: vi.fn().mockResolvedValue(0), findMany },
    };
    const service = new MusicianSearchService(prisma as never, {} as never);

    await service.search(
      {
        page: 1,
        limit: 20,
        sort: MusicianSearchSort.COMPATIBILITY,
        query: 'diez años',
        influence: 'spinetta',
        location: 'Rosario',
      },
      null,
    );

    const call = findMany.mock.calls[0]?.[0] as unknown as {
      where: {
        influences?: unknown;
        AND: { locationVisibility: Visibility };
        OR: Array<Record<string, unknown>>;
      };
    };
    expect(call.where.influences).toBeUndefined();
    expect(call.where.AND.locationVisibility).toBe(Visibility.PUBLIC);
    expect(call.where.OR.some((condition) => 'experience' in condition)).toBe(false);
  });
});
