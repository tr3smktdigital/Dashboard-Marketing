declare module 'pg' {
  export interface PoolConfig {
    user?: string
    host?: string
    database?: string
    password?: string
    port?: number
    connectionString?: string
    ssl?: unknown
  }

  export interface QueryResult<Row = Record<string, unknown>> {
    rows: Row[]
  }

  export class Pool {
    constructor(config?: PoolConfig)
    query<Row = Record<string, unknown>>(
      text: string,
      values?: readonly unknown[]
    ): Promise<QueryResult<Row>>
    end(): Promise<void>
  }
}
