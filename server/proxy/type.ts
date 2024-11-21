import { Question } from 'dns-packet'
import { find } from 'better-sqlite3-proxy'
import { proxy } from '../../db/proxy.js'

let forwardingTypes = proxy.dns_request_type
  .filter(row => row.forward)
  .map(row => row.type)

export function isForwardingType(type: string): boolean {
  return forwardingTypes.includes(type)
}

export function logQuestionType(questions: Question[] | undefined) {
  if (!questions) return
  let type_id: number | undefined
  for (let question of questions) {
    let type = question.type
    let row = find(proxy.dns_request_type, { type })
    if (row) {
      type_id = row.id!
      row.count++
      row.last_seen = Date.now()
    } else {
      type_id = proxy.dns_request_type.push({
        type,
        count: 1,
        last_seen: Date.now(),
        forward: isForwardingType(type),
      })
    }
  }
  return type_id
}
