// Diagnostic endpoint to check database connection configuration
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Try to connect and get basic info
    await prisma.$connect()
    
    // Get DATABASE_URL info without exposing password
    const dbUrl = process.env.DATABASE_URL || 'NOT SET'
    const dbHost = dbUrl.match(/@([^:]+)/)?.[1] || 'UNKNOWN'
    const isPooler = dbHost.includes('pooler.supabase.com')
    
    // Try a simple query
    const userCount = await prisma.user.count()
    
    return Response.json({
      success: true,
      connectionInfo: {
        host: dbHost,
        isPooler: isPooler,
        isDirectConnection: dbHost.includes('db.') && dbHost.includes('.supabase.co'),
      },
      testQuery: {
        userCount,
      },
      message: isPooler 
        ? '✅ Using Connection Pooler (correct for Vercel)'
        : '⚠️ Using Direct Connection (may not work on Vercel)'
    })
  } catch (error) {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET'
    const dbHost = dbUrl.match(/@([^:]+)/)?.[1] || 'UNKNOWN'
    
    return Response.json({
      success: false,
      connectionInfo: {
        host: dbHost,
        isPooler: dbHost.includes('pooler.supabase.com'),
        isDirectConnection: dbHost.includes('db.') && dbHost.includes('.supabase.co'),
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ Database connection failed'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

