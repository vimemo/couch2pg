import migrate from '../lib/pgmigration'
import db, {ensureDatabaseExists} from '../lib/pgconnection'

const PG_URL = 'postgres://localhost:5432/migration-test'
const pg = db(PG_URL)

describe('migration', () => {
  const cleanUp = async () => {
    await pg.schema.dropTableIfExists('couchdb')
    await pg.schema.dropTableIfExists('couchdb_progress')
    await pg.schema.dropTableIfExists('couch2pg_migrations')
  }

  beforeEach(async () => {
    try {
      await cleanUp()
    } catch(err) {
      if(!err.message.includes('does not exist')){//db does not exist
        throw err
      }
    }
    await ensureDatabaseExists(PG_URL)
  })
  afterEach(() => cleanUp())
  afterAll(() => {
    try {
      pg.destroy()
    } catch(err) {
      if(!err.message.includes('does not exist')){//db does not exist
        throw err
      }
    }
  })

  test('migration creates tables and indexes', async () => {
    const migrations = await migrate(PG_URL)
    expect(migrations).toMatchSnapshot()
    expect(await pg.schema.hasTable('couchdb')).toBe(true)
    expect(await pg.schema.hasTable('couchdb_progress')).toBe(true)
    expect(await pg.schema.hasTable('couch2pg_migrations')).toBe(true)

    const INDEXES_QUERY = 'select * from pg_indexes where tablename not like \'pg%\''
    const indexes = (await pg.schema.raw(INDEXES_QUERY)).rows
    expect(indexes[0].indexname).toBe('couch2pg_migrations_pkey')
    expect(indexes[1].indexname).toBe('couchdb_doc_type')
    expect(indexes[2].indexname).toBe('couchdb_doc_uuid')

    const seqs = (await pg.raw('select * from couchdb_progress')).rows
    expect(seqs.length).toBe(0)
  })

  test('migration to an existing seq without source', async () => {
    const conn = db(PG_URL)
    await conn.raw('CREATE TABLE couchdb_progress(seq varchar)')
    await conn('couchdb_progress').insert({seq:'44'})
    await migrate(PG_URL)
    const seqs = (await pg.raw('select * from couchdb_progress')).rows
    expect(seqs.length).toBe(1)
    expect(seqs[0].seq).toBe('44')
    expect(seqs[0].source).toEqual('default-source')
  })
})
