import {splitAt} from 'ramda'
import Pouch from '../lib/pouch'
import Pg, {SEQUENCE_DB} from '../lib/pg'
import db, {ensureDatabaseExists} from '../lib/pgconnection'
import migrate from '../lib/pgmigration'
import Couch2Pg from '../lib/couch2pg'
import * as random from './mocks/random'

describe('replicate', () => {
  const COUCH_URL = 'http://localhost:5984/couchtest'
  const PG_URL = 'postgres://localhost:5432/replicatetest'

  const pg = new Pg(PG_URL, COUCH_URL)
  let pouch

  const cleanUp = async () => {
    try {
      await pg.drop()
      if(pouch) {
        await pouch.db.destroy()
        pouch = null
      }
      ensureDatabaseExists(PG_URL)
    } catch(err) {
      if(!err.message.includes('does not exist')){//db does not exist
        throw err
      }
    }
  }

  beforeEach(() => cleanUp())
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

  describe('replication', () => {
    beforeEach(async () => {
      pouch = new Pouch(COUCH_URL)
      // Starting with 10 docs
      await pouch.db.bulkDocs(random.docs(10))
    })

    test('initial and no-change replication', async () => {
      await migrate(PG_URL)
      const couch2pg = new Couch2Pg(pouch, pg)
      await couch2pg.replicate()
      expect(await pg.count()).toEqual(10)
      expect(await pg.sortedDocs()).toEqual(await pouch.sortedDocs())

      //No change replication
      await couch2pg.replicate()
      expect(await pg.count()).toEqual(10)
      expect(await pg.sortedDocs()).toEqual(await pouch.sortedDocs())
    })

    describe('subsequent creations, updates and deletions', () => {
      beforeEach(async () => {
        const docs = await pouch.docs()
        const [deletes, updates] = splitAt(5, docs)

        // Removing 5 docs
        deletes.forEach((doc) => doc._deleted = true)
        await pouch.db.bulkDocs(deletes)

        // Updating 5 docs
        updates.forEach((doc) => doc.data = random.label())
        await pouch.db.bulkDocs(updates)

        // Inserting 10 docs
        await pouch.db.bulkDocs(random.docs(10))
      })

      test('after updates, deletes, etc', async () => {
        await migrate(PG_URL)
        expect((await pg.sequences()).length).toBe(0)

        await pg.db(SEQUENCE_DB).insert({seq: 30, source: 'couch1'})
        await migrate(PG_URL)

        const seqs = await pg.sequences()
        expect(seqs.length).toBe(1)
        expect(seqs[0].seq).toBe('30')
        expect(seqs[0].source).toEqual('couch1')

        await new Couch2Pg(pouch, pg).replicate()

        expect(await pg.count()).toEqual(15)
        expect(await pg.count()).toEqual(await pouch.count())
        expect(await pg.sortedDocs()).toEqual(await pouch.sortedDocs())
      })
    })

    test('should handle documents with \\u0000 in it', async () => {
      await migrate(PG_URL)
      const couch2pg = new Couch2Pg(pouch, pg)
      couch2pg.couch.db.put({
        _id: 'u0000-escaped',
        data: 'blah blah \u0000\u0000\u0000\u0000 blah'
      })
      await couch2pg.replicate()
    })
  })
})
