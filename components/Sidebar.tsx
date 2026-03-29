import Link from 'next/link'

import type { DashboardClient } from '@/lib/supabase/dashboard'

type SidebarProps = {
  clients: DashboardClient[]
}

export default function Sidebar({ clients }: SidebarProps) {
  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        background: '#111827',
        color: '#ffffff',
        padding: '24px 16px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div>
        <h2 style={{ marginBottom: '8px' }}>Dashboard</h2>
        <p style={{ color: '#9ca3af', lineHeight: 1.5, fontSize: '14px' }}>
          Navegacao principal do produto multi-cliente.
        </p>
      </div>

      <nav style={{ display: 'grid', gap: '12px' }}>
        <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>
          {'Vis\u00E3o Geral'}
        </Link>

        <Link href="/dashboard/meta-ads" style={{ color: '#fff', textDecoration: 'none' }}>
          Meta Ads
        </Link>

        <Link href="/dashboard/google-ads" style={{ color: '#fff', textDecoration: 'none' }}>
          Google Ads
        </Link>

        <Link href="/dashboard/ga4" style={{ color: '#fff', textDecoration: 'none' }}>
          GA4
        </Link>

        <Link href="/dashboard/crm" style={{ color: '#fff', textDecoration: 'none' }}>
          CRM
        </Link>
      </nav>

      <div
        style={{
          marginTop: 'auto',
          padding: '16px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.06)',
        }}
      >
        <p
          style={{
            marginBottom: '12px',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#93c5fd',
          }}
        >
          Clientes
        </p>

        <div style={{ display: 'grid', gap: '10px' }}>
          {clients.length > 0 ? (
            clients.map((client) => (
              <div key={client.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <strong style={{ display: 'block' }}>{client.name}</strong>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                  {client.slug} • {client.role}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.5 }}>
              Nenhum cliente vinculado ainda.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
