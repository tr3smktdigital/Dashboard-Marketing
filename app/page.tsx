import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, #38bdf8 0%, #e0f2fe 18%, #f8fafc 48%, #dbeafe 100%)',
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(14, 116, 144, 0.15)',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '999px',
              background: '#0ea5e9',
            }}
          />
          Supabase Auth + multi-tenant dashboard
        </div>

        <div
          style={{
            display: 'grid',
            gap: '24px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            alignItems: 'start',
          }}
        >
          <section>
            <h1
              style={{
                fontSize: 'clamp(40px, 8vw, 68px)',
                lineHeight: 0.95,
                marginBottom: '20px',
              }}
            >
              Dashboards de marketing com acesso por cliente.
            </h1>
            <p
              style={{
                maxWidth: '620px',
                fontSize: '18px',
                lineHeight: 1.7,
                color: '#334155',
                marginBottom: '28px',
              }}
            >
              Base segura com autenticacao via Supabase, isolamento por tenant com
              RLS e uma estrutura pronta para crescer sem acoplar o app ao banco de
              tracking bruto.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                href="/sign-up"
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                Criar conta
              </Link>

              <Link
                href="/login"
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  fontWeight: 700,
                }}
              >
                Entrar
              </Link>
            </div>
          </section>

          <section
            style={{
              background: 'rgba(255,255,255,0.74)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
            }}
          >
            <h2 style={{ marginBottom: '16px', fontSize: '22px' }}>Base pronta</h2>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <strong>Auth centralizado</strong>
                <p style={{ color: '#475569', marginTop: '4px' }}>
                  Login, cadastro, confirmacao e logout com sessao SSR.
                </p>
              </div>
              <div>
                <strong>Multi-cliente com RLS</strong>
                <p style={{ color: '#475569', marginTop: '4px' }}>
                  Acesso isolado por membership no banco, sem gambiarra em app code.
                </p>
              </div>
              <div>
                <strong>Infra separada</strong>
                <p style={{ color: '#475569', marginTop: '4px' }}>
                  App novo na VPS e banco do produto no Supabase, preservando o n8n.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
