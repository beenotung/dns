import { config } from 'dotenv'
import populateEnv from 'populate-env'

config()

export let env = {
  PORT: 8080,
  UPSTREAM_ADDRESS: '8.8.8.8',
}

populateEnv(env, { mode: 'halt' })
