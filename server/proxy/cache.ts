import { SECOND } from '@beenotung/tslib/time.js'
import { Packet, Question } from 'dns-packet'

export type PacketCacheEntry = {
  response: Packet
  timer: NodeJS.Timeout
}

let interval = 10 * SECOND

export class PacketCache {
  cache: Record<string, PacketCacheEntry> = {}
  put(question: Question, response: Packet) {
    let key = toKey(question)

    let last = this.cache[key]
    if (last) {
      clearTimeout(last.timer)
    }

    let timer = setTimeout(() => {
      delete this.cache[key]
    }, interval)
    this.cache[key] = { response, timer }
  }
  get(question: Question): PacketCacheEntry | undefined {
    let key = toKey(question)
    return this.cache[key]
  }
}

function toKey(question: Question) {
  let key = `${question.type}:${question.name}`
  if (question.class) {
    key += ':' + question.class
  }
  return key
}
