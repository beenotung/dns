import { print } from 'listening-on'
import { createServer } from 'tls'
import { env } from './env'

let tcp_socket = createServer()

tcp_socket.on('connection', socket => {
  console.log('tls connection', socket.remoteAddress)
  socket.on('data', (data: Buffer) => {
    console.log('tls data:', data)
  })
  socket.on('error', (err: Error) => {
    console.log('tls error:', err)
  })
  socket.on('end', () => {
    console.log('tls end', socket.remoteAddress)
  })
})

tcp_socket.listen(env.TCP_PORT, () => {
  print({ port: env.TCP_PORT, protocol: 'tls' })
})
