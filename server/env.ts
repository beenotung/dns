import { config as loadEnv } from 'dotenv'
import { populateEnv } from 'populate-env'
import { cwd } from 'process'

loadEnv()

export let env = {
  NODE_ENV: 'development' as 'development' | 'production',
  COOKIE_SECRET: '',
  EPOCH: 1, // to distinct initial run or restart in serve mode
  UPLOAD_DIR: 'uploads',
  EMAIL_SERVICE: 'google',
  EMAIL_HOST: 'smtp.gmail.com',
  EMAIL_PORT: 587,
  EMAIL_USER: '',
  EMAIL_PASSWORD: '',
  SMS_ACCOUNT_KEY: '',
  SMS_API_KEY: '',
  ORIGIN: '',
  UDP_PORT: 8053,
  TCP_PORT: 8153,
  HTTP_PORT: 8053,
  UPSTREAM_UDP_HOST: '8.8.8.8',
  UPSTREAM_HTTPS_HOST: 'dns.google',
}
applyDefaultEnv()

function applyDefaultEnv() {
  if (process.env.NODE_ENV === 'production') return
  let PORT = process.env.PORT || env.PORT
  env.COOKIE_SECRET ||= process.env.COOKIE_SECRET || cwd()
  env.EMAIL_USER ||= process.env.EMAIL_USER || 'skip'
  env.EMAIL_PASSWORD ||= process.env.EMAIL_PASSWORD || 'skip'
  env.SMS_ACCOUNT_KEY ||= process.env.SMS_ACCOUNT_KEY || 'skip'
  env.SMS_API_KEY ||= process.env.SMS_API_KEY || 'skip'
  env.ORIGIN ||= process.env.ORIGIN || 'http://localhost:' + PORT
}

populateEnv(env, { mode: 'halt' })
