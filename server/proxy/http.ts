import { Response, Router } from 'express'
import dnsPacket from 'dns-packet'
import { env } from '../env.js'
import { blocked } from './filter.js'
import { filterDomain } from './filter.js'

let app = Router()

async function onHttpQuery(msg: Buffer, res: Response) {
  let packet = dnsPacket.decode(msg)
  if (
    packet.type === 'query' &&
    packet.questions?.length === 1 &&
    packet.questions[0].type === 'A'
  ) {
    let question = packet.questions[0]
    let result = filterDomain(question.name)
    if (result === blocked) {
      res.status(403)
      res.end('blocked')
      return
    }
    try {
      console.log('forwarding http query:', question)
      let response = await fetch(
        `https://${env.UPSTREAM_HTTPS_HOST}/dns-query?dns=` +
          msg.toString('base64url'),
      )
      let body = Buffer.from(await response.arrayBuffer())
      let packet = dnsPacket.decode(body)
      res.header('Content-Type', 'application/dns-message')
      res.write(body)
      res.end()
      console.log('forwarded http response:', packet.answers?.[0])
    } catch (error) {
      console.log('failed to forward http response:', { error })
    }
    return
  }
  console.log('unknown http packet:', packet)
  res.status(400)
  res.end('unknown packet')
}

app.get('/dns-query', (req, res) => {
  let dns = req.query.dns
  if (typeof dns !== 'string') {
    res.status(400).send('dns query is required')
    return
  }
  let msg = Buffer.from(dns, 'base64url')
  onHttpQuery(msg, res)
})

app.post('/dns-query', (req, res) => {
  let msg = Buffer.alloc(0)
  req.setEncoding('binary')
  req.on('data', chunk => {
    if (typeof chunk === 'string') {
      chunk = Buffer.from(chunk, 'binary')
    }
    msg = Buffer.concat([msg, chunk])
  })
  req.on('end', () => {
    onHttpQuery(msg, res)
  })
})

export default { router: app }