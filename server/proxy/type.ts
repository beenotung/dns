import { proxy } from '../../db/proxy.js'

let forwardingTypes = proxy.dns_request_type
  .filter(row => row.forward)
  .map(row => row.type)

export function isForwardingType(type: string): boolean {
  return forwardingTypes.includes(type)
}
