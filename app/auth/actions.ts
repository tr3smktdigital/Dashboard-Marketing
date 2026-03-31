'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

function getSingleValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

function toSearchParamMessage(message: string) {
  return encodeURIComponent(message)
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeBaseUrl(value: string | null | undefined) {
  if (!value) {
    return null
  }

  try {
    const parsed = new URL(value)
    const blockedHosts = new Set(['0.0.0.0', '127.0.0.1', 'localhost'])

    if (blockedHosts.has(parsed.hostname)) {
      return null
    }

    return parsed.origin
  } catch {
    return null
  }
}

async function getBaseUrl() {
  const configuredUrl = normalizeBaseUrl(
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null
  )

  if (configuredUrl) {
    return configuredUrl
  }

  const headerStore = await headers()
  const origin = headerStore.get('origin')

  if (origin) {
    return origin
  }

  const host =
    headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000'
  const protocol =
    headerStore.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')

  return `${protocol}://${host}`
}

export async function login(formData: FormData) {
  const email = getSingleValue(formData.get('email'))
  const password = getSingleValue(formData.get('password'))

  if (!email || !password) {
    redirect('/login?error=Preencha+email+e+senha.')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${toSearchParamMessage(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const fullName = getSingleValue(formData.get('full_name'))
  const email = getSingleValue(formData.get('email'))
  const password = getSingleValue(formData.get('password'))

  if (!fullName || !email || !password) {
    redirect('/sign-up?error=Preencha+nome,+email+e+senha.')
  }

  const supabase = await createClient()
  const baseUrl = await getBaseUrl()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${baseUrl}/auth/confirm`,
    },
  })

  if (error) {
    redirect(`/sign-up?error=${toSearchParamMessage(error.message)}`)
  }

  revalidatePath('/', 'layout')

  if (data.session) {
    redirect('/dashboard')
  }

  redirect('/login?message=Confira+seu+email+para+confirmar+o+cadastro.')
}

export async function resendSignupConfirmation(formData: FormData) {
  const email = getSingleValue(formData.get('email'))

  if (!email) {
    redirect('/login?error=Informe+o+email+para+reenviar+a+confirmacao.')
  }

  const supabase = await createClient()
  const baseUrl = await getBaseUrl()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${baseUrl}/auth/confirm`,
    },
  })

  if (error) {
    redirect(`/login?error=${toSearchParamMessage(error.message)}`)
  }

  redirect('/login?message=Enviamos+um+novo+email+de+confirmacao.')
}

export async function createClientAction(formData: FormData) {
  const name = getSingleValue(formData.get('name'))
  const rawSlug = getSingleValue(formData.get('slug'))
  const slug = toSlug(rawSlug || name)

  if (!name || !slug) {
    redirect('/dashboard?error=Informe+nome+e+slug+validos+para+o+cliente.')
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('create_client', {
    p_name: name,
    p_slug: slug,
  })

  if (error) {
    redirect(`/dashboard?error=${toSearchParamMessage(error.message)}`)
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard?message=Cliente+criado+com+sucesso.')
}
