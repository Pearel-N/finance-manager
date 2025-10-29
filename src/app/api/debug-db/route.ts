// Simple diagnostic endpoint - doesn't require database connection
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT SET'
  
  // Extract hostname from connection string without exposing password
  let host = 'UNKNOWN'
  let port = 'UNKNOWN'
  let isPooler = false
  let isDirect = false
  
  if (dbUrl !== 'NOT SET') {
    // Match the host part: postgresql://user:pass@host:port/db
    const hostMatch = dbUrl.match(/@([^:]+(?::\d+)?)/)
    if (hostMatch) {
      const hostPort = hostMatch[1]
      if (hostPort.includes(':')) {
        [host, port] = hostPort.split(':')
      } else {
        host = hostPort
      }
    }
    
    isPooler = host.includes('pooler.supabase.com')
    isDirect = host.includes('db.') && host.includes('.supabase.co')
  }
  
  return Response.json({
    databaseUrlExists: dbUrl !== 'NOT SET',
    connectionInfo: {
      host,
      port,
      isPooler,
      isDirectConnection: isDirect,
      hasPgbouncer: dbUrl.includes('pgbouncer=true'),
    },
    recommendation: isPooler 
      ? '✅ Using Connection Pooler (correct for Vercel)' 
      : isDirect
      ? '❌ Using Direct Connection (will NOT work on Vercel)'
      : '⚠️ Unknown connection type',
    rawUrlPreview: dbUrl !== 'NOT SET' 
      ? dbUrl.replace(/:[^:@]+@/, ':****@') // Hide password
      : 'NOT SET'
  })
}

