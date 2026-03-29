import Link from 'next/link'
import { redirect } from 'next/navigation'

import { login, resendSignupConfirmation } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Promise<{
  error?: string | string[]
  message?: string | string[]
}>

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function LoginPage({
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
  const message = getFirstValue(params.message)

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at top left, #1d4ed8 0%, #0f172a 45%, #020617 100%)',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(15, 23, 42, 0.88)',
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
              color: '#93c5fd',
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            SaaS de dashboards
          </p>
          <h1 style={{ marginBottom: '8px', fontSize: '30px' }}>Entrar</h1>
          <p style={{ color: '#cbd5e1', lineHeight: 1.5 }}>
            Acesse o painel do seu cliente com autenticao baseada em Supabase Auth.
          </p>
        </div>

        {message ? (
          <p
            style={{
              marginBottom: '16px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.14)',
              color: '#bbf7d0',
              padding: '12px 14px',
            }}
          >
            {message}
          </p>
        ) : null}

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

        <form action={login} style={{ display: 'grid', gap: '16px' }}>
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
              placeholder="Sua senha"
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
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Entrar no dashboard
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <p style={{ marginBottom: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
            Ja criou a conta e nao recebeu o e-mail? Reenvie a confirmacao abaixo.
          </p>

          <form action={resendSignupConfirmation} style={{ display: 'grid', gap: '12px' }}>
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

            <button
              type="submit"
              style={{
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(103, 232, 249, 0.35)',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#bae6fd',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reenviar e-mail de confirmacao
            </button>
          </form>
        </div>

        <p style={{ marginTop: '20px', color: '#cbd5e1' }}>
          Ainda nao tem conta?{' '}
          <Link href="/sign-up" style={{ color: '#93c5fd' }}>
            Criar acesso
          </Link>
        </p>
      </div>
    </main>
  )
}

