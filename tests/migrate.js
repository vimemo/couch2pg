import migrate from '../lib/pgmigration'
import connection, {ensureDatabaseExists} from '../lib/pgconnection'

const PG_URL = `${process.env.TEST_PG_URL}/migration-test`
const db = connection(PG_URL)

describe('migration', () => {
  const cleanUp = async () => {
    await db.schema.dropTableIfExists('couchdb')
    await db.schema.dropTableIfExists('couchdb_progress')
    await db.schema.dropTableIfExists('couch2pg_migrations')
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
      db.destroy()
    } catch(err) {
      if(!err.message.includes('does not exist')){//db does not exist
        throw err
      }
    }
  })

  test('migration creates tables and indexes', async () => {
    const migrations = await migrate(PG_URL)
    expect(migrations).toMatchSnapshot()
    expect(await db.schema.hasTable('couchdb')).toBe(true)
    expect(await db.schema.hasTable('couchdb_progress')).toBe(true)
    expect(await db.schema.hasTable('couch2pg_migrations')).toBe(true)

    const INDEXES_QUERY = 'select * from pg_indexes where tablename not like \'pg%\''
    const indexes = (await db.schema.raw(INDEXES_QUERY)).rows
    expect(indexes[0].indexname).toBe('couch2pg_migrations_pkey')
    expect(indexes[1].indexname).toBe('couchdb_doc_type')
    expect(indexes[2].indexname).toBe('couchdb_doc_uuid')

    const seqs = (await db.raw('select * from couchdb_progress')).rows
    expect(seqs.length).toBe(0)
  })

  test('migration to an existing seq without source', async () => {
    const db = connection(PG_URL)
    await db.raw('CREATE TABLE couchdb_progress(seq varchar)')
    await db('couchdb_progress').insert({seq:'44'})
    await migrate(PG_URL)
    const seqs = (await db.raw('select * from couchdb_progress')).rows
    await db.destroy()
    expect(seqs.length).toBe(1)
    expect(seqs[0].seq).toBe('44')
    expect(seqs[0].source).toEqual('default-source')
  })
})
