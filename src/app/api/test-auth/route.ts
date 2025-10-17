// Test Supabase connection
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    
    return Response.json({
      success: true,
      user: data.user ? 'User found' : 'No user',
      error: error?.message || 'No error'
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
