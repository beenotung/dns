import * as node_dns from "dns";

const dns = require('native-dns');
import {DnsRequest} from "../src/native-dns";

const {NAME_TO_QTYPE, QTYPE_TO_NAME} = require('native-dns-packet/consts')

export function resolve(req: DnsRequest) {
  for (const question of req.question) {
    const rrtype = QTYPE_TO_NAME[question.type]
    node_dns.resolve(question.name, rrtype, (err, addresses) => {
      for (const address of addresses) {
        const answer = dns[rrtype]({
          name: question.name,
          address,
          ttl: 600,
        })
      }
    })
  }
}

