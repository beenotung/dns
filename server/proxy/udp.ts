import { print } from 'listening-on'
import { createSocket, RemoteInfo, Socket } from 'dgram'
import dnsPacket from 'dns-packet'
import { env } from '../env.js'
import { blocked, makeEmptyResponse } from './filter.js'
import { filterDomain } from './filter.js'
import { isForwardingType } from './type.js'

let udp4_socket = createSocket('udp4')
let udp6_socket = createSocket('udp6')

// id -> rinfo
let pending: Record<number, RemoteInfo> = {}

function forwardQuery(
  socket: Socket,
  msg: Buffer,
  rinfo: RemoteInfo,
  id: number,
  question: dnsPacket.Question,
) {
  pending[id] = rinfo
  socket.send(msg, 53, env.UPSTREAM_UDP_HOST, (error, bytes) => {
    if (error) {
      console.log('failed to forward udp query:', { question, error })
      delete pending[id]
    } else {
      console.log('forwarded udp query:', question)
      // console.log(msg.toString('base64url'))
    }
  })
}

function onMessage(socket: Socket, msg: Buffer, rinfo: RemoteInfo) {
  let packet = dnsPacket.decode(msg)
  // console.log('packet:', packet)
  if (
    packet.id &&
    packet.type === 'query' &&
    packet.questions?.length === 1 &&
    isForwardingType(packet.questions[0].type)
  ) {
    let question = packet.questions[0]
    let result = filterDomain(question.name)
    if (result === blocked) {
      console.log('blocked udp query:', question)
      let response = makeEmptyResponse(packet)
      socket.send(dnsPacket.encode(response), rinfo.port, rinfo.address)
      return
    }
    forwardQuery(socket, msg, rinfo, packet.id, question)
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
  if (
    packet.id &&
    !packet.questions?.some(question => isForwardingType(question.type))
  ) {
    console.log('non forwarding type query?', packet)
    forwardQuery(socket, msg, rinfo, packet.id, packet.questions![0])
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
