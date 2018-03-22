import migrate from '../lib/migrator'
import Couch from '../lib/Couch'
import Pg from '../lib/Pg'
import pgconnection from '../lib/pgconnection'

import couchdocs from '../testutils/docs.json'

describe('pg', () => {
  const PG_URL = 'postgres://localhost:5432/pg-test'
  const db = pgconnection(PG_URL)
  const pg = new Pg(PG_URL, 'xyz')

  const cleanUp = async (schema) => {
    await schema.dropTableIfExists('couchdb')
    await schema.dropTableIfExists('couchdb_progress')
    await schema.dropTableIfExists('couch2pg_migrations')
  }

  beforeEach(() => cleanUp(db.schema))
  afterEach(async () => cleanUp(db.schema))
  afterAll(async () => {
    await db.destroy()
    await pg.db.destroy()
  })

  test('invalid constructor', async ()=> {
    expect(() => { new Pg(PG_URL) }).toThrowError(/Identify the couchdb/)
  })

  test('insert, docs, delete, count', async () => {
    await migrate(PG_URL)

    await pg.insert(couchdocs)
    let docs = await pg.docs()
    expect(docs.length).toBe(2)
    expect(docs).toMatchSnapshot()

    await pg.delete([docs[0].doc._id])
    expect(await pg.count()).toBe(1)
    await pg.delete([])
    expect(await pg.count()).toBe(1)
  })

  describe('sequences', () => {
    const PG2_URL = 'postgres://localhost:5432/pg-test2'
    const db2 = pgconnection(PG2_URL)
    const pg2 = new Pg(PG2_URL, 'abc')

    beforeEach(() => cleanUp(db2.schema))
    afterAll(async () => {
      await db2.destroy()
      await pg2.db.destroy()
    })

    test('get and update sequences', async () => {
      await migrate(PG_URL)
      await migrate(PG2_URL)

      const seq = await pg.seq()
      expect(seq).toBe(0)
      await pg.updateSeq(3)
      expect(await pg.seq()).toBe(3)

      const seq2 = await pg2.seq()
      expect(seq2).toBe(0)
      await pg2.updateSeq(13)
      expect(await pg2.seq()).toBe(13)
      expect(await pg.seq()).toBe(3)
    })
  })
})
