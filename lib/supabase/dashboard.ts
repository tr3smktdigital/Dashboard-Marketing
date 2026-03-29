import 'server-only'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type DashboardClient = {
  id: string
  name: string
  slug: string
  plan: string
  role: 'owner' | 'admin' | 'analyst' | 'viewer'
}

export type DashboardUser = {
  id: string
  email: string
  fullName: string | null
}

type MembershipRow = {
  role: DashboardClient['role']
  clients:
    | {
        id: string
        name: string
        slug: string
        plan: string
      }
    | {
        id: string
        name: string
        slug: string
        plan: string
      }[]
    | null
}

function getClientRecord(client: MembershipRow['clients']) {
  if (!client) {
    return null
  }

  if (Array.isArray(client)) {
    return client[0] ?? null
  }

  return client
}

export async function getDashboardContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('client_memberships')
        .select(
          `
            role,
            clients (
              id,
              name,
              slug,
              plan
            )
          `
        )
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
    ])

  if (membershipsError) {
    throw new Error(membershipsError.message)
  }

  const clients: DashboardClient[] = ((memberships ?? []) as MembershipRow[])
    .flatMap((membership) => {
      const client = getClientRecord(membership.clients)

      if (!client) {
        return []
      }

      return [
        {
          id: client.id,
          name: client.name,
          slug: client.slug,
          plan: client.plan,
          role: membership.role,
        },
      ]
    })

  return {
    user: {
      id: user.id,
      email: profile?.email ?? user.email ?? '',
      fullName: profile?.full_name ?? null,
    } satisfies DashboardUser,
    clients,
  }
}
