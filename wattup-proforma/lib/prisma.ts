import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Pooled connection string, not the direct one: two serverless apps against one
// Postgres multiply connections. See ADR 0001 section 5.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
