export interface Environment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  CORS_ORIGINS: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: number;
}

function readString(value: unknown, fallback: string, key: string): string {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${key} must be a string`);
  }
  return String(value);
}

export function validateEnvironment(raw: Record<string, unknown>): Environment {
  const nodeEnv = readString(raw.NODE_ENV, 'development', 'NODE_ENV');
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test or production');
  }

  const port = Number(readString(raw.PORT, '3000', 'PORT'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  const databaseUrl = readString(raw.DATABASE_URL, '', 'DATABASE_URL');
  if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  }

  const jwtSecret = readString(raw.JWT_SECRET, '', 'JWT_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  const jwtExpiresIn = Number(readString(raw.JWT_EXPIRES_IN, '900', 'JWT_EXPIRES_IN'));
  if (!Number.isInteger(jwtExpiresIn) || jwtExpiresIn < 60 || jwtExpiresIn > 86400) {
    throw new Error('JWT_EXPIRES_IN must be between 60 and 86400 seconds');
  }

  return {
    NODE_ENV: nodeEnv as Environment['NODE_ENV'],
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    CORS_ORIGINS: readString(
      raw.CORS_ORIGINS,
      'http://localhost:4200,http://localhost:8100',
      'CORS_ORIGINS',
    ),
  };
}
