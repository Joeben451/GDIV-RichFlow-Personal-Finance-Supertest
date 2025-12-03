import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma CLI Configuration for Prisma 7
 * 
 * This file configures how the Prisma CLI interacts with the database.
 * The connection URL is used for migrations and introspection.
 */
export default defineConfig({
  // The main entry for your schema
  schema: 'prisma/schema.prisma',
  
  // Database connection for Prisma CLI (db push, introspection, etc.)
  datasource: {
    url: env('DATABASE_URL'),
  },
});
