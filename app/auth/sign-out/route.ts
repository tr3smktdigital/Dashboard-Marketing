import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')

  const logoutRedirect = new URL(request.url)
  logoutRedirect.pathname = '/login'
  logoutRedirect.search = 'message=Voce+saiu+da+sua+conta.'

  return NextResponse.redirect(logoutRedirect, { status: 302 })
}
