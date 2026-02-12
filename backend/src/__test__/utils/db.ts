import prisma from '../../config/database.config.js';

export const resetDatabase = async () => {
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>
    `SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
    .map( ({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
};