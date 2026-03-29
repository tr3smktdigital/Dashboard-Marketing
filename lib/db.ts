import 'server-only'

/**
 * Deprecated module kept only as a migration note.
 *
 * Authentication and multi-tenant data access now use Supabase clients
 * from `lib/supabase/*`, so request flows no longer depend on a direct
 * PostgreSQL connection from the app.
 */
export const databaseProvider = 'supabase'
