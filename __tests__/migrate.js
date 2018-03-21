import migrate from '../lib/migrator'
import db from '../lib/pgconnection'

const PG_URL = 'postgres://localhost:5432/migration-test'
const pg = db(PG_URL)

describe('migrator', () => {
  const cleanUp = async () => {
    await pg.schema.dropTableIfExists('couchdb')
    await pg.schema.dropTableIfExists('couchdb_progress')
    await pg.schema.dropTableIfExists('couch2pg_migrations')
  }

  beforeEach(() => cleanUp())
  afterEach(() => cleanUp())

  test('migration creates tables and indexes', async () => {
    const migrations = await migrate(PG_URL)
    expect(migrations).toMatchSnapshot()
    expect(await pg.schema.hasTable('couchdb')).toBe(true)
    expect(await pg.schema.hasTable('couchdb_progress')).toBe(true)
    expect(await pg.schema.hasTable('couch2pg_migrations')).toBe(true)

    const INDEXES_QUERY = "select * from pg_indexes where tablename not like 'pg%'"
    const indexes = (await pg.schema.raw(INDEXES_QUERY)).rows
    expect(indexes[0].indexname).toBe('couch2pg_migrations_pkey')
    expect(indexes[1].indexname).toBe('couchdb_doc_type')
    expect(indexes[2].indexname).toBe('couchdb_doc_uuid')
  })
})
