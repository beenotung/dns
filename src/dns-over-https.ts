import express from 'express'
import fetch from 'node-fetch'
import {DnsRequest} from './native-dns'

const Packet = require('native-dns-packet/packet')

export function startDnsOverHttpsServer(port = 3000) {
  const app = express()
  app.listen(port, () => {
    console.log('express listening on port', port)
  })
  app.get('/dns-query', handleRequest)
  app.get('/', (req, res) => {
    res.write('dns-over-https server')
    res.end()
  })
  return app
}


async function handleRequest(
  req: express.Request,
  res: express.Response,
  next: Function,
) {
  const dns = req.query.dns
  if (typeof dns !== 'string') {
    return next()
  }
  const buf = Buffer.from(dns, 'base64')
  const dnsRequest: DnsRequest = Packet.parse(buf)
  console.log('q', dnsRequest.question)
  try {
    const response = await fetch('https://dns.google/dns-query?dns=' + dns)
    const buf = Buffer.from(await response.arrayBuffer())
    res.write(buf)
    res.end()
    return
  } catch (e) {
    console.log('failed to query dns from upstream', e)
    return
  }
}
