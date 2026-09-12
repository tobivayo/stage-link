import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const roles = [
  { code: 'USER', name: 'Usuario', description: 'Rol base de toda cuenta registrada.' },
  { code: 'MUSICIAN', name: 'Músico', description: 'Perfil profesional de músico.' },
  {
    code: 'BAND_ADMIN',
    name: 'Administrador de banda',
    description: 'Administración de bandas o proyectos musicales.',
  },
  {
    code: 'VENUE_ADMIN',
    name: 'Administrador de venue',
    description: 'Administración de espacios y salas.',
  },
  { code: 'PROVIDER', name: 'Proveedor', description: 'Prestación de servicios musicales.' },
  { code: 'ADMIN', name: 'Administrador', description: 'Administración interna de StageLink.' },
] as const;

async function main(): Promise<void> {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: role,
      update: { name: role.name, description: role.description },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
