import { appendFileSync } from 'fs'
import { proxy } from './proxy'
import { find } from 'better-sqlite3-proxy'

export const blocked = 0
export const forward = 1

type State = 'forward' | 'block'

let default_state: State = proxy.setting[1].default_state || 'forward'

export function filterDomain(
  domain_name: string,
): typeof blocked | typeof forward {
  let now = Date.now()

  let timestamp = new Date().toISOString()
  appendFileSync('queries.log', `${timestamp} ${domain_name}\n`)

  let domain = find(proxy.domain, { domain: domain_name })
  let state: State
  let domain_id: number
  if (domain) {
    domain_id = domain.id!
    state = domain.state || default_state
  } else {
    domain_id = proxy.domain.push({ domain: domain_name, state: null })
    state = default_state
  }

  proxy.request.push({
    domain_id,
    timestamp: now,
  })

  return state === 'block' ? blocked : forward
}
