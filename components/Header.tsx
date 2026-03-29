type HeaderProps = {
  clientName: string
  userLabel: string
}

export default function Header({ clientName, userLabel }: HeaderProps) {
  return (
    <header
      style={{
        height: '72px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        fontFamily: 'Arial, sans-serif',
        gap: '16px',
      }}
    >
      <div>
        <strong>TR3S Dashboard</strong>
        <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          {clientName}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ color: '#475569', textAlign: 'right' }}>{userLabel}</div>

        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            style={{
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '10px',
              padding: '10px 12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  )
}
