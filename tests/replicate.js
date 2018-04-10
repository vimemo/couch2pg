import {splitAt} from 'ramda'
import Pouch from '../lib/pouch'
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
      couch = new Pouch(COUCH_URL)
      // Starting with 10 docs
      await couch.db.bulkDocs(random.docs(10))
    })

    test('initial and no-change replication', async () => {
      await migrate(PG_URL)
      const couch2pg = new Couch2Pg(couch, pg)
      await couch2pg.replicate()
      expect(await pg.count()).toEqual(10)
      expect(await pg.sortedDocs()).toEqual(await couch.sortedDocs())

      //No change replication
      await couch2pg.replicate()
      expect(await pg.count()).toEqual(10)
      expect(await pg.sortedDocs()).toEqual(await couch.sortedDocs())
    })

    describe('subsequent creations, updates and deletions', () => {
      beforeEach(async () => {
        const docs = await couch.docs()
        const [deletes, updates] = splitAt(5, docs)

        // Removing 5 docs
        deletes.forEach((doc) => doc._deleted = true)
        await couch.db.bulkDocs(deletes)

        // Updating 5 docs
        updates.forEach((doc) => doc.data = random.label())
        await couch.db.bulkDocs(updates)

        // Inserting 10 docs
        await couch.db.bulkDocs(random.docs(10))
      })

      test('after updates, deletes, etc', async () => {
        await migrate(PG_URL)
        await new Couch2Pg(couch, pg).replicate()

        expect(await pg.count()).toEqual(15)
        expect(await pg.count()).toEqual(await couch.count())
        expect(await pg.sortedDocs()).toEqual(await couch.sortedDocs())
      })
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
