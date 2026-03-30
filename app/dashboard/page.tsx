import { createClientAction } from '@/app/auth/actions'
import { getClientMetrics } from '@/lib/getClientMetrics'
import { getUserClient } from '@/lib/getUserClient'
import { getDashboardContext } from '@/lib/supabase/dashboard'

type SearchParams = Promise<{
  error?: string | string[]
  message?: string | string[]
  source?: string | string[]
}>

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { user, clients } = await getDashboardContext()
  const directClient = await getUserClient()
  const params = await searchParams
  const error = getFirstValue(params.error)
  const message = getFirstValue(params.message)
  const sourceFilter = getFirstValue(params.source)
  const activeClient = directClient ?? clients[0] ?? null
  const activeClientView = activeClient
    ? {
        ...activeClient,
        plan: 'plan' in activeClient ? activeClient.plan : 'mvp',
        role: 'role' in activeClient ? activeClient.role : 'owner',
      }
    : null

  if (!activeClientView) {
    return (
      <section
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
        }}
      >
        <p
          style={{
            marginBottom: '12px',
            color: '#2563eb',
            fontSize: '13px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Primeiro tenant
        </p>
        <h1 style={{ fontFamily: 'Arial, sans-serif', fontSize: '32px', marginBottom: '10px' }}>
          Criar o primeiro cliente
        </h1>
        <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
          {user.fullName ?? user.email}, sua conta ja esta autenticada. Agora vamos
          registrar o primeiro cliente para liberar o acesso multi-tenant ao dashboard.
        </p>

        {message ? (
          <p
            style={{
              marginBottom: '16px',
              borderRadius: '12px',
              background: '#dcfce7',
              color: '#166534',
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
              background: '#fee2e2',
              color: '#991b1b',
              padding: '12px 14px',
            }}
          >
            {error}
          </p>
        ) : null}

        <form action={createClientAction} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Nome do cliente</label>
            <input
              name="name"
              type="text"
              placeholder="Ex: Cliente Demo"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Slug do cliente
            </label>
            <input
              name="slug"
              type="text"
              placeholder="cliente-demo"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
              }}
            />
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
              Se deixar em branco, o sistema gera o slug a partir do nome.
            </p>
          </div>

          <button
            type="submit"
            style={{
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Criar cliente
          </button>
        </form>
      </section>
    )
  }

  const metrics = await getClientMetrics(sourceFilter)
  const linkedClientsCount = Math.max(clients.length, 1)

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {message ? (
        <p
          style={{
            borderRadius: '12px',
            background: '#dcfce7',
            color: '#166534',
            padding: '12px 14px',
          }}
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          style={{
            borderRadius: '12px',
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px 14px',
          }}
        >
          {error}
        </p>
      ) : null}

      <div>
        <h1 style={{ fontFamily: 'Arial, sans-serif', fontSize: '34px', marginBottom: '8px' }}>
          {'Vis\u00E3o Geral'}
        </h1>
        <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
          Estrutura autenticada pronta. Seu tenant ativo no momento e{' '}
          <strong>{activeClientView.name}</strong> no plano <strong>{activeClientView.plan}</strong>.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '16px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <article
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <p style={{ color: '#64748b', marginBottom: '8px' }}>Usuario autenticado</p>
          <strong>{user.fullName ?? user.email}</strong>
        </article>

        <article
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <p style={{ color: '#64748b', marginBottom: '8px' }}>Clientes vinculados</p>
          <strong>{linkedClientsCount}</strong>
        </article>

        <article
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <p style={{ color: '#64748b', marginBottom: '8px' }}>Papel atual</p>
          <strong>{activeClientView.role}</strong>
        </article>
      </div>

      {metrics?.rows.length ? (
        <section style={{ display: 'grid', gap: '16px' }}>
          <h2 style={{ margin: 0 }}>Métricas do cliente</h2>

          <div
            style={{
              display: 'grid',
              gap: '16px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <article
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
              }}
            >
              <p style={{ color: '#64748b', marginBottom: '8px' }}>Investimento total</p>
              <strong>R$ {metrics.summary.totalSpend.toFixed(2)}</strong>
            </article>

            <article
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
              }}
            >
              <p style={{ color: '#64748b', marginBottom: '8px' }}>Cliques totais</p>
              <strong>{metrics.summary.totalClicks}</strong>
            </article>

            <article
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
              }}
            >
              <p style={{ color: '#64748b', marginBottom: '8px' }}>Leads totais</p>
              <strong>{metrics.summary.totalLeads}</strong>
            </article>

            <article
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
              }}
            >
              <p style={{ color: '#64748b', marginBottom: '8px' }}>Conversões totais</p>
              <strong>{metrics.summary.totalConversions}</strong>
            </article>

            <article
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
              }}
            >
              <p style={{ color: '#64748b', marginBottom: '8px' }}>Receita total</p>
              <strong>R$ {metrics.summary.totalRevenue.toFixed(2)}</strong>
            </article>
          </div>

          <p style={{ color: '#64748b', margin: 0 }}>
            Fonte: {metrics.sourceFilter ?? 'todas'} • Registros: {metrics.rows.length}
          </p>
        </section>
      ) : (
        <section
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Métricas do cliente</h2>
          <p style={{ color: '#64748b', marginBottom: 0 }}>
            Ainda não existem métricas para este cliente.
          </p>
        </section>
      )}

      <section
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
        }}
      >
        <h2 style={{ marginBottom: '12px' }}>Proximos passos do produto</h2>
        <p style={{ color: '#64748b', lineHeight: 1.7 }}>
          O dashboard ja esta protegido por sessao e RLS. A partir daqui, o proximo
          bloco natural e criar tabelas como <code>client_metrics</code> e ligar as
          paginas de Meta Ads, Google Ads, GA4 e CRM aos dados do tenant.
        </p>
      </section>
    </div>
  )
}
