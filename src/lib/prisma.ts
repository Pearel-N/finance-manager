import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.includes('pgbouncer=true') && !process.env.DATABASE_URL?.includes('connection_limit')
        ? `${process.env.DATABASE_URL}&connection_limit=1`
        : process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Get or create the "System" category for a user.
 * This category is used for system-generated transactions (transfers, balance adjustments, etc.)
 * @param userId - The user ID
 * @returns The system category ID
 */
export async function getOrCreateSystemCategory(userId: string): Promise<string> {
  // Try to find existing system category
  let systemCategory = await prisma.category.findFirst({
    where: {
      userId: userId,
      name: 'System',
    },
  })

  // Create if it doesn't exist
  if (!systemCategory) {
    systemCategory = await prisma.category.create({
      data: {
        name: 'System',
        userId: userId,
      },
    })
  }

  return systemCategory.id
}
