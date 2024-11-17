import { DAY, HOUR } from '@beenotung/tslib/time.js'
import { DateTimeText, toLocaleDateTimeString } from './datetime.js'
import {
  format_2_digit,
  format_datetime,
  format_timestamp_code,
} from '@beenotung/tslib/format.js'
import { TimezoneDate } from 'timezone-date.ts'
import { Context } from '../context.js'

let threshold = 6 * HOUR

export function LastSeen(
  attrs: { time: number; now: number },
  context: Context,
) {
  let diff = attrs.now - attrs.time
  let date = new TimezoneDate(attrs.time)
  date.timezone = +8
  if (diff < threshold) {
    let h = format_2_digit(date.getHours())
    let m = format_2_digit(date.getMinutes())
    return `${h}:${m}`
  }
  let y = format_2_digit(date.getFullYear())
  let m = format_2_digit(date.getMonth() + 1)
  let d = format_2_digit(date.getDate())
  let H = format_2_digit(date.getHours())
  let M = format_2_digit(date.getMinutes())
  return `${y}-${m}-${d} ${H}:${M}`
}
