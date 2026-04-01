import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { getSupabaseEnv } from './env'

function getServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!value) {
    throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }

  return value
}

export function createAdminClient() {
  const { url } = getSupabaseEnv()

  return createClient(url, getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
