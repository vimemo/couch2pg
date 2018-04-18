
const CurlRequest = require('curl-request')
const knex = require('knex')

const wait = ms => new Promise((r, j)=>setTimeout(r, ms))
const WAIT_TIME = 5000

const curl = new CurlRequest()

const waitForCouchToBecomeAvailable = async (url, timeout, maxRetries) => {
  let retries = 0
  while(true) {
    if(retries ++ >= maxRetries) {
      console.log(`****** ERROR: Unable to connect to couch [${url}]!`)
      process.exit(1)
    }
    try {
      const {statusCode} = await curl.get(url)
      if(statusCode === 200) {
        console.log(`- Couch [${url}] is now avaliable.`)
        break;
      }
    } catch(err) {}
    console.log(`====> Waiting on couch [${url}] to become available.`)
    await wait(timeout)
  }
}

const waitForPgToBecomeAvailable = async (url, timeout, maxRetries) => {
  const conn = knex({client: 'pg', connection: url})
  let retries = 0
  while(true) {
    if(retries ++ >= maxRetries) {
      console.log(`****** ERROR: Unable to connect to pg [${url}]!`)
      process.exit(1)
    }
    try {
      await conn.raw('SELECT * FROM pg_catalog.pg_tables')
      console.log(`- pg [${url}] is now avaliable.`)
      await conn.destroy()
      break;
    } catch(err) {
      if(err.code !== 'ECONNREFUSED') {
        process.exit(1)
      }
      console.log(`====> Waiting on pg [${url}] to become available.`)
      await wait(timeout)
    }
  }
}

module.exports = async () => {
  await waitForCouchToBecomeAvailable(process.env.TEST_COUCH_URL, WAIT_TIME, 10)
  await waitForPgToBecomeAvailable(process.env.TEST_PG_URL, WAIT_TIME, 10)
}
