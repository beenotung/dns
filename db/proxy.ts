import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type Method = {
  id?: null | number
  method: string
}

export type Url = {
  id?: null | number
  url: string
}

export type UaType = {
  id?: null | number
  name: string
  count: number
}

export type RequestSession = {
  id?: null | number
  language: null | string
  timezone: null | string
  timezone_offset: null | number
}

export type UaBot = {
  id?: null | number
  name: string
  count: number
}

export type UserAgent = {
  id?: null | number
  user_agent: string
  count: number
  ua_type_id: null | number
  ua_type?: UaType
  ua_bot_id: null | number
  ua_bot?: UaBot
}

export type UaStat = {
  id?: null | number
  last_request_log_id: number
}

export type User = {
  id?: null | number
  username: null | string
  password_hash: null | string // char(60)
  email: null | string
  tel: null | string
  avatar: null | string
  is_admin: null | boolean
  nickname: null | string
}

export type RequestLog = {
  id?: null | number
  method_id: number
  method?: Method
  url_id: number
  url?: Url
  user_agent_id: null | number
  user_agent?: UserAgent
  request_session_id: null | number
  request_session?: RequestSession
  user_id: null | number
  user?: User
  timestamp: number
}

export type VerificationAttempt = {
  id?: null | number
  passcode: string // char(6)
  email: null | string
  tel: null | string
}

export type VerificationCode = {
  id?: null | number
  uuid: null | string
  passcode: string // char(6)
  email: null | string
  tel: null | string
  request_time: number
  revoke_time: null | number
  match_id: null | number
  match?: VerificationAttempt
  user_id: null | number
  user?: User
}

export type Pattern = {
  id?: null | number
  pattern: string
  state: null | ('forward' | 'block')
}

export type Domain = {
  id?: null | number
  domain: string
  count: null | number
  last_seen: null | number
  state: null | ('forward' | 'block')
}

export type DnsRequestType = {
  id?: null | number
  type: string
  count: number
  last_seen: number
  forward: null | boolean
}

export type DnsRequest = {
  id?: null | number
  domain_id: number
  domain?: Domain
  type_id: null | number
  type?: DnsRequestType
  timestamp: number
}

export type Setting = {
  id?: null | number
  default_state: null | ('forward' | 'block')
}

export type DBProxy = {
  method: Method[]
  url: Url[]
  ua_type: UaType[]
  request_session: RequestSession[]
  ua_bot: UaBot[]
  user_agent: UserAgent[]
  ua_stat: UaStat[]
  user: User[]
  request_log: RequestLog[]
  verification_attempt: VerificationAttempt[]
  verification_code: VerificationCode[]
  pattern: Pattern[]
  domain: Domain[]
  dns_request_type: DnsRequestType[]
  dns_request: DnsRequest[]
  setting: Setting[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    method: [],
    url: [],
    ua_type: [],
    request_session: [],
    ua_bot: [],
    user_agent: [
      /* foreign references */
      ['ua_type', { field: 'ua_type_id', table: 'ua_type' }],
      ['ua_bot', { field: 'ua_bot_id', table: 'ua_bot' }],
    ],
    ua_stat: [],
    user: [],
    request_log: [
      /* foreign references */
      ['method', { field: 'method_id', table: 'method' }],
      ['url', { field: 'url_id', table: 'url' }],
      ['user_agent', { field: 'user_agent_id', table: 'user_agent' }],
      ['request_session', { field: 'request_session_id', table: 'request_session' }],
      ['user', { field: 'user_id', table: 'user' }],
    ],
    verification_attempt: [],
    verification_code: [
      /* foreign references */
      ['match', { field: 'match_id', table: 'verification_attempt' }],
      ['user', { field: 'user_id', table: 'user' }],
    ],
    pattern: [],
    domain: [],
    dns_request_type: [],
    dns_request: [
      /* foreign references */
      ['domain', { field: 'domain_id', table: 'domain' }],
      ['type', { field: 'type_id', table: 'dns_request_type' }],
    ],
    setting: [],
  },
})
