import { find } from 'better-sqlite3-proxy'
import { proxy } from './proxy'

proxy.setting[1] ||= {
  default_state: 'forward',
}

let types = ['A', 'AAAA', 'UNKNOWN_65']
for (let type of types) {
  let row = find(proxy.dns_request_type, { type })
  if (row && row.forward !== true) {
    row.forward = true
  }
}
