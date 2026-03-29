import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { getDashboardContext } from '@/lib/supabase/dashboard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, clients } = await getDashboardContext()
  const activeClient = clients[0] ?? null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <Sidebar clients={clients} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header
          clientName={activeClient?.name ?? 'Nenhum cliente ainda'}
          userLabel={user.fullName ?? user.email}
        />

        <main style={{ padding: '24px' }}>{children}</main>
      </div>
    </div>
  )
}
