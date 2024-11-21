import { print } from 'listening-on'
import { createSocket, RemoteInfo, Socket } from 'dgram'
import dnsPacket, { Packet } from 'dns-packet'
import { env } from '../env.js'
import { blocked, makeEmptyResponse } from './filter.js'
import { filterDomain } from './filter.js'
import { isForwardingType, logQuestionType } from './type.js'
import { PacketCache } from './cache.js'

let udp4_socket = createSocket('udp4')
let udp6_socket = createSocket('udp6')

// id -> rinfo
let pending: Record<number, RemoteInfo> = {}

let cache4 = new PacketCache()
let cache6 = new PacketCache()

function forwardQuery(
  cache: PacketCache,
  socket: Socket,
  msg: Buffer,
  rinfo: RemoteInfo,
  id: number,
  question: dnsPacket.Question,
  query: Packet,
) {
  pending[id] = rinfo
  let entry = cache.get(question)
  if (entry) {
    entry.response.id = query.id
    let msg = dnsPacket.encode(entry.response)
    onMessage(cache, socket, msg, rinfo, 'cached')
    return
  }
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

function onMessage(
  cache: PacketCache,
  socket: Socket,
  msg: Buffer,
  rinfo: RemoteInfo,
  flag: 'cached' | 'fresh',
) {
  let packet = dnsPacket.decode(msg)
  // console.log('packet:', packet)
  logQuestionType(packet.questions)
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
    forwardQuery(cache, socket, msg, rinfo, packet.id, question, packet)
    return
  }
  if (packet.id && packet.type === 'response' && packet.id in pending) {
    let rinfo = pending[packet.id]
    cache.put(packet.questions![0], packet)
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
    forwardQuery(
      cache,
      socket,
      msg,
      rinfo,
      packet.id,
      packet.questions![0],
      packet,
    )
  } else {
    console.log('multiple questions udp packet?:', packet)
  }
}

udp4_socket.on('message', (msg, rinfo) => {
  console.log('udp4 message:', msg, rinfo)
  onMessage(cache4, udp4_socket, msg, rinfo, 'fresh')
})

udp6_socket.on('message', (msg, rinfo) => {
  console.log('udp6 message:', msg, rinfo)
  onMessage(cache6, udp6_socket, msg, rinfo, 'fresh')
})

udp4_socket.bind(env.UDP_PORT, '0.0.0.0', () => {
  print({ port: env.UDP_PORT, protocol: 'udp4' })
})

udp6_socket.bind(env.UDP_PORT, '::', () => {
  print({ port: env.UDP_PORT, protocol: 'udp6' })
})
