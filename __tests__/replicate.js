import R from 'ramda'
import Couch from '../lib/couch'
import Pg from '../lib/pg'
import db from '../lib/pgconnection'
import migrate from '../lib/migrator'
import Couch2Pg from '../lib/couch2pg'


describe('replicate', () => {
  const COUCH_URL = 'http://admin:pass@localhost:5984/medic'
  const PG_URL = 'postgres://localhost:5432/medic-analytics-test'

  const pg = db(PG_URL)
  const couch = new Couch(COUCH_URL)
  const postg = new Pg(PG_URL, COUCH_URL)

  const cleanUp = async () => {
    await pg.schema.dropTableIfExists('couchdb')
    await pg.schema.dropTableIfExists('couchdb_progress')
    await pg.schema.dropTableIfExists('couch2pg_migrations')
  }

  beforeEach(() => cleanUp())
  afterEach(() => cleanUp())
  afterAll(() => {
    pg.destroy()
    postg.db.destroy()
  })

  test('replication', async () => {
    await migrate(PG_URL)

    await new Couch2Pg(couch, postg).replicate()
    expect(await postg.count()).toEqual(await couch.count())
  })
})
