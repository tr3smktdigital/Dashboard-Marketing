import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type UserClient = {
  id: string
  name: string
  slug: string
}

type UserClientRow = {
  clients:
    | {
        id: string
        name: string
        slug: string
      }
    | {
        id: string
        name: string
        slug: string
      }[]
    | null
}

function toClient(value: UserClientRow['clients']): UserClient | null {
  if (!value) {
    return null
  }

  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export async function getUserClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('user_clients')
    .select(
      `
        clients (
          id,
          name,
          slug
        )
      `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  return toClient((data?.[0] as UserClientRow | undefined)?.clients ?? null)
}
