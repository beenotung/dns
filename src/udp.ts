import { print } from 'listening-on'
import { createSocket, RemoteInfo, Socket } from 'dgram'
import dnsPacket from 'dns-packet'
import { env } from './env'
import { blocked } from './filter'
import { filterDomain } from './filter'

let udp4_socket = createSocket('udp4')
let udp6_socket = createSocket('udp6')

// id -> rinfo
let pending: Record<number, RemoteInfo> = {}

function onMessage(socket: Socket, msg: Buffer, rinfo: RemoteInfo) {
  let packet = dnsPacket.decode(msg)
  // console.log('packet:', packet)
  if (
    packet.id &&
    packet.type === 'query' &&
    packet.questions?.length === 1 &&
    packet.questions[0].type === 'A'
  ) {
    let question = packet.questions[0]
    let result = filterDomain(question.name)
    if (result === blocked) {
      console.log('blocked udp query:', question)
      return
    }
    pending[packet.id] = rinfo
    socket.send(msg, 53, env.UPSTREAM_UDP_HOST, (error, bytes) => {
      if (error) {
        console.log('failed to forward udp query:', { question, error })
        delete pending[packet.id!]
      } else {
        console.log('forwarded udp query:', question)
        // console.log(msg.toString('base64url'))
      }
    })
    return
  }
  if (packet.id && packet.type === 'response' && packet.id in pending) {
    let rinfo = pending[packet.id]
    socket.send(msg, rinfo.port, rinfo.address, (error, bytes) => {
      if (error) {
        console.log('failed to forward udp response:', { packet, error })
      } else {
        console.log('forwarded udp response:', packet.answers?.[0])
      }
    })
    delete pending[packet.id]
    return
  }
  console.log('unknown udp packet:', packet)
  if (!packet.questions?.some(question => question.type === 'A')) {
    console.log('non A-type query?', packet)
    pending[packet.id!] = rinfo
    socket.send(msg, 53, env.UPSTREAM_UDP_HOST, (error, bytes) => {
      if (error) {
        console.log('failed to forward udp packet:', { packet, error })
        delete pending[packet.id!]
      } else {
        console.log('forwarded unknown udp packet:', packet)
      }
    })
  } else {
    console.log('multiple questions udp packet?:', packet)
  }
}

udp4_socket.on('message', (msg, rinfo) => {
  console.log('udp4 message:', msg, rinfo)
  onMessage(udp4_socket, msg, rinfo)
})

udp6_socket.on('message', (msg, rinfo) => {
  console.log('udp6 message:', msg, rinfo)
  onMessage(udp6_socket, msg, rinfo)
})

udp4_socket.bind(env.UDP_PORT, '0.0.0.0', () => {
  print({ port: env.UDP_PORT, protocol: 'udp4' })
})

udp6_socket.bind(env.UDP_PORT, '::', () => {
  print({ port: env.UDP_PORT, protocol: 'udp6' })
})
