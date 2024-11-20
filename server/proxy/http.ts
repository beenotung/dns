import { Response, Router } from 'express'
import dnsPacket from 'dns-packet'
import { env } from '../env.js'
import { blocked, makeEmptyResponse } from './filter.js'
import { filterDomain } from './filter.js'
import { find } from 'better-sqlite3-proxy'
import { proxy } from '../../db/proxy.js'
import { isForwardingType, logQuestionType } from './type.js'

let app = Router()

async function forwardQuery(
  msg: Buffer,
  res: Response,
  question: dnsPacket.Question,
) {
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
}

async function onHttpQuery(msg: Buffer, res: Response) {
  let packet = dnsPacket.decode(msg)
  logQuestionType(packet.questions)
  if (
    packet.type === 'query' &&
    packet.questions?.length === 1 &&
    isForwardingType(packet.questions[0].type)
  ) {
    let question = packet.questions[0]
    let result = filterDomain(question.name)
    if (result === blocked) {
      // res.status(403)
      // res.end('blocked')
      let response = makeEmptyResponse(packet)
      res.header('Content-Type', 'application/dns-message')
      res.write(dnsPacket.encode(response))
      res.end()
      return
    }
    forwardQuery(msg, res, question)
    return
  }
  console.log('unknown http packet:', packet)
  if (!packet.questions?.some(question => isForwardingType(question.type))) {
    console.log('non forwarding type query?', packet)
    forwardQuery(msg, res, packet.questions![0])
    return
  }
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
