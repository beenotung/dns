import { config } from 'dotenv'
import populateEnv from 'populate-env'

config()

export let env = {
  UDP_PORT: 8053,
  TCP_PORT: 8153,
  HTTP_PORT: 8053,
  UPSTREAM_UDP_HOST: '8.8.8.8',
  UPSTREAM_HTTPS_HOST: 'dns.google',
}

populateEnv(env, { mode: 'halt' })
