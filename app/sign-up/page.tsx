import Link from 'next/link'
import { redirect } from 'next/navigation'

import { signup } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Promise<{
  error?: string | string[]
}>

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const error = getFirstValue(params.error)

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #082f49 0%, #0f172a 42%, #111827 100%)',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(15, 23, 42, 0.9)',
          padding: '32px',
          borderRadius: '20px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 24px 60px rgba(2, 6, 23, 0.45)',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <p
            style={{
              marginBottom: '12px',
              color: '#67e8f9',
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Onboarding seguro
          </p>
          <h1 style={{ marginBottom: '8px', fontSize: '30px' }}>Criar conta</h1>
          <p style={{ color: '#cbd5e1', lineHeight: 1.5 }}>
            O cadastro cria seu acesso no Supabase Auth e sincroniza o profile no banco.
          </p>
        </div>

        {error ? (
          <p
            style={{
              marginBottom: '16px',
              borderRadius: '12px',
              background: 'rgba(248, 113, 113, 0.14)',
              color: '#fecaca',
              padding: '12px 14px',
            }}
          >
            {error}
          </p>
        ) : null}

        <form action={signup} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Nome completo</label>
            <input
              name="full_name"
              type="text"
              placeholder="Seu nome"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>E-mail</label>
            <input
              name="email"
              type="email"
              placeholder="voce@empresa.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Senha</label>
            <input
              name="password"
              type="password"
              placeholder="No minimo 6 caracteres"
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#fff',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0891b2, #2563eb)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Criar conta
          </button>
        </form>

        <p style={{ marginTop: '20px', color: '#cbd5e1' }}>
          Ja possui acesso?{' '}
          <Link href="/login" style={{ color: '#67e8f9' }}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
