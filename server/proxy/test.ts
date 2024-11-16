import { decode } from 'dns-packet'
import { readFileSync } from 'fs'

let buffer = readFileSync('udp-response.bin')

let packet = decode(buffer)

console.log(packet)
