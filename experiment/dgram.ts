import * as dgram from "dgram";

const port = 8053
const socket = dgram.createSocket({
  type: "udp4",
  reuseAddr: true,
}, (msg, rinfo) => {
  console.log({msg, rinfo})
})
socket.on("connect", () => {
  console.log('on connect')
})
socket.on("message", (msg, rinfo) => {
  console.log('on message', {msg, rinfo})
})
// socket.connect(53,'8.8.8.8',() => {
//   console.log('connected')
// })
socket.bind(port, '0.0.0.0', () => {
  console.log('listening on port', port)
})

