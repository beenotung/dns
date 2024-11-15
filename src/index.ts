import { print } from 'listening-on'
import { createSocket, RemoteInfo } from 'dgram'
import dnsPacket from 'dns-packet'
import { env } from './env'

let socket = createSocket('udp4')

// id -> rinfo
let pending: Record<number, { rinfo: RemoteInfo }> = {}

function onQuery(domain: string): 'pass' | 'block' {
  return 'pass'
}

socket.on('message', (msg, rinfo) => {
  let packet = dnsPacket.decode(msg)
  // console.log('packet:', packet)
  if (
    packet.id &&
    packet.type === 'query' &&
    packet.questions?.length === 1 &&
    packet.questions[0].type === 'A'
  ) {
    let question = packet.questions[0]
    let result = onQuery(question.name)
    if (result === 'block') {
      console.log('blocked query:', question)
      return
    }
    pending[packet.id] = { rinfo }
    socket.send(msg, 53, env.UPSTREAM_ADDRESS, (error, bytes) => {
      if (error) {
        console.log('failed to forward query:', { question, error })
        delete pending[packet.id!]
      } else {
        console.log('forwarded query:', question)
      }
    })
    return
  }
  if (packet.id && packet.type === 'response' && packet.id in pending) {
    let { rinfo } = pending[packet.id]
    delete pending[packet.id]
    socket.send(msg, rinfo.port, rinfo.address, (error, bytes) => {
      if (error) {
        console.log('failed to forward response:', { packet, error })
      } else {
        console.log('forwarded response:', packet.answers?.[0])
      }
    })
    return
  }
  console.log('unknown packet:', packet)
})

socket.bind(env.PORT, '0.0.0.0', () => {
  print({ port: env.PORT, protocol: 'udp' })
})
