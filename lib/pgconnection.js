import purl from 'url'
import knex from 'knex'

const ensureDatabaseExists = async (url) => {
  const opts = purl.parse(url)
  const dbname = opts.path.slice(1)
  const conn = knex(url.replace(opts.path, ''))
  try {
    await conn.raw(`CREATE DATABASE \"${dbname}\"`)
  } catch(err){} //db already exists - ignore
  conn.destroy()
}

export default (url) => {
  ensureDatabaseExists(url)
  return knex({client: 'pg', connection: url})
}
