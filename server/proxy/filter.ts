import { appendFileSync } from 'fs'
import { Pattern, proxy } from '../../db/proxy.js'
import { find } from 'better-sqlite3-proxy'
import { Packet, Question } from 'dns-packet'
import { db } from '../../db/db.js'

export const blocked = 0
export const forward = 1

type State = 'forward' | 'block'

export let default_state: State = proxy.setting[1].default_state || 'forward'

export function filterDomain(
  question: Question,
  type_id: number,
): typeof blocked | typeof forward {
  let now = Date.now()

  let timestamp = new Date().toISOString()
  appendFileSync(
    'queries.log',
    `${timestamp} ${question.type} ${question.name}\n`,
  )

  let domain = find(proxy.domain, { domain: question.name })
  let state: State
  let domain_id: number
  if (domain) {
    domain_id = domain.id!
    state = domain.state || filterByPattern(question.name) || default_state
    domain.count!++
    domain.last_seen = now
  } else {
    domain_id = proxy.domain.push({
      domain: question.name,
      state: null,
      count: 1,
      last_seen: now,
    })
    state = filterByPattern(question.name) || default_state
  }

  proxy.dns_request.push({
    domain_id,
    timestamp: now,
    type_id,
  })

  return state === 'block' ? blocked : forward
}

db.function(
  'domain_pattern_match',
  (domain: string, pattern: string): number => {
    if (pattern.startsWith('*.')) {
      return domain.endsWith(pattern.slice(2)) ? 1 : 0
    }
    if (pattern.endsWith('.*')) {
      return domain.startsWith(pattern.slice(0, -2)) ? 1 : 0
    }
    throw 'unknown pattern: ' + JSON.stringify(pattern)
  },
)

let select_pattern = db
  .prepare<{ domain: string }, Pattern['state']>(
    /* sql */ `
select
  state
from pattern
where state is not null
  and domain_pattern_match(:domain, pattern.pattern)
order by length(pattern) desc
limit 1
`,
  )
  .pluck()

export function filterByPattern(domain: string) {
  return select_pattern.get({ domain }) || null
}

export function makeEmptyResponse(query: Packet) {
  let response: Packet = {
    id: query.id,
    type: 'response',
    questions: query.questions,
    answers: [],
  }
  return response
}
