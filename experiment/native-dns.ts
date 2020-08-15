import * as node_dns from 'dns'
import {DnsRequest, DnsResponse} from "../src/native-dns";

const dns = require('native-dns');
const server = dns.createServer();

const {NAME_TO_QTYPE, QTYPE_TO_NAME} = require('native-dns-packet/consts')


server.on('request', function (request: DnsRequest, response: DnsResponse) {
  // console.log(request)
  for (const question of request.question) {
    console.log({question})
    const rrtype = QTYPE_TO_NAME[question.type]
    console.log({rrtype})
    node_dns.resolve(question.name, rrtype, (err, addresses) => {
      if (err) {
        console.log('failed to resolve', question, err)
        return
      }
      for (const address of addresses) {
        response.answer.push(dns[rrtype]({
          name: question.name,
          address,
          ttl: 600,
        }));
      }
      response.send();
    })
  }
});

server.on('error', function (err: any, buff: Buffer, req: DnsRequest, res: DnsResponse) {
  console.log('socket error', err);
  console.log('buff:', buff)
  console.log('req:', req)
  console.log('res:', res)
});

const port = 15353
server.serve(port);
console.log('listening on port', port)
