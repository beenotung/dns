import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type Domain = {
  id?: null | number
  domain: string
  state: null | ('forward' | 'block')
}

export type Request = {
  id?: null | number
  domain_id: number
  domain?: Domain
  timestamp: number
}

export type Setting = {
  id?: null | number
  default_state: null | ('forward' | 'block')
}

export type DBProxy = {
  domain: Domain[]
  request: Request[]
  setting: Setting[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    domain: [],
    request: [
      /* foreign references */
      ['domain', { field: 'domain_id', table: 'domain' }],
    ],
    setting: [],
  },
})
