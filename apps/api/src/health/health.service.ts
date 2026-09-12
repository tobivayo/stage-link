import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma/prisma.service';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: 'stagelink-api';
  timestamp: string;
  database: 'up' | 'down';
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    let database: HealthResponse['database'] = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      service: 'stagelink-api',
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
