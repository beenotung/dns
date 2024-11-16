import { appendFileSync } from 'fs'

export const blocked = 0
export const forward = 1

export function filterDomain(domain: string): typeof blocked | typeof forward {
  let now = new Date().toISOString()
  appendFileSync('queries.log', `${now} ${domain}\n`)
  return forward
}
