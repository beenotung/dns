import { decode } from 'dns-packet'
import { readFileSync } from 'fs'

let buffer = readFileSync('out')

let packet = decode(buffer)

console.log(packet)
