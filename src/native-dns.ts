export type DnsQuestion = {
  name: string
  type: number
  class: number
}
export type DnsRequest = {
  question: DnsQuestion[]
}
export type DnsResponse = any
