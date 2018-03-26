import R from 'ramda'
import Couch from '../lib/couch'
import Pg from '../lib/pg'
import db from '../lib/pgconnection'
import migrate from '../lib/pgmigration'
import Couch2Pg from '../lib/couch2pg'
import * as random from '../testutils/random'

describe('replicate', () => {
  const COUCH_URL = 'http://admin:pass@localhost:5984/couchtest'
  const PG_URL = 'postgres://localhost:5432/pgtest'

  const pg = new Pg(PG_URL, COUCH_URL)
  let couch

  const cleanUp = async () => {
    await pg.drop()
    if(couch) {
      await couch.db.destroy()
      couch = null
    }
  }

  beforeEach(() => cleanUp())
  afterEach(() => cleanUp())
  afterAll(() => pg.destroy())

  describe('replication', () => {
    beforeEach(async () => {
       couch = new Couch(COUCH_URL)
       await couch.db.bulkDocs(random.docs(10))
    })

    test('replication', async () => {
      await migrate(PG_URL)
      await new Couch2Pg(couch, pg).replicate()
      expect(await pg.count()).toEqual(await couch.count())
      // const sortedCouchDocs = await couch.docs(null, true)
      // const sortedPgDocs = await pg.docs(true)
      // expect(sortedPgDocs[0].doc).toEqual(sortedCouchDocs[0])
    })

    test('should handle documents with \\u0000 in it', async () => {
      await migrate(PG_URL)
      const couch2pg = new Couch2Pg(couch, pg)
      couch2pg.couch.db.put({
        _id: 'u0000-escaped',
        data: 'blah blah \u0000\u0000\u0000\u0000 blah'
      })
      await couch2pg.replicate()
    })
  })
})
