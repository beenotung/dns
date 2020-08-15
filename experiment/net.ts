import * as net from "net";

const port = 8053

const server = net.createServer()
server.on("connection", socket => {
  console.log('connection')
})
server.on('listening', () => {
  console.log('listening on port', port)
})
server.on("error", err => {
  console.log('error', err)
})
server.listen(port, '0.0.0.0')
