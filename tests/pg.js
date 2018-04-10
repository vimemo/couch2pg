import migrate from '../lib/pgmigration'
import Pouch from '../lib/Pouch'
import Pg from '../lib/Pg'
import pgconnection from '../lib/pgconnection'

import couchdocs from './mocks/docs.json'

describe('pg', () => {
  const COUCH_URL = 'http://admin:pass@localhost:5984/something'
  const PG_URL = 'postgres://localhost:5432/pg-test'
  const DEFAULT_DATABASE = 'default-database'
  const pg = new Pg(PG_URL, COUCH_URL)

  beforeEach(async () => await pg.drop())
  afterEach(async () => await pg.drop())
  afterAll(async () => await pg.destroy())

  test('invalid constructor', async ()=> {
    expect(() => new Pg()).toThrowError(/Missing Parameter/)
    expect(() => new Pg(PG_URL)).toThrowError(/Missing Parameter/)
    expect.assertions(2)
  })

  test('insert, docs, delete, count', async () => {
    await migrate(PG_URL)

    await pg.insert(couchdocs)
    const docs = await pg.docs()
    expect(docs.length).toBe(2)
    expect(docs).toMatchSnapshot()
    await pg.delete([docs[0].doc._id])
    expect(await pg.count()).toBe(1)
    await pg.delete([])
    expect(await pg.count()).toBe(1)
  })

  describe('sequences', () => {
    const PG2_URL = 'postgres://localhost:5432/pg-test2'
    const pg2 = new Pg(PG2_URL, 'http://localhost:5984/secondpgdb')

    beforeEach(async () => await pg2.drop())
    afterAll(async () => await pg2.destroy())

    test('get and update sequences', async () => {
      await migrate(PG_URL)
      await migrate(PG2_URL)

      const seq = await pg.seq()
      expect(seq).toBe(0)
      await pg.updateSeq(3)
      expect(await pg.seq()).toBe('3')

      const seq2 = await pg2.seq()
      expect(seq2).toBe(0)
      await pg2.updateSeq(13)
      expect(await pg2.seq()).toBe('13')
      expect(await pg.seq()).toBe('3')
    })
  })

  describe('sequences for different scenarios', () => {
    test('existing system with default database', async () => {
      await migrate(PG_URL)
      // Zero sequences
      expect((await pg.sequences()).length).toBe(0)
      // Setup an existing sequence with default-database
      await pg.db('couchdb_progress').insert({seq: '44', source: DEFAULT_DATABASE})

      // Requesting sequence for a given url returns the detault sequence
      // and that sequence source gets updated with this source
      expect(await pg.seq()).toBe('44')
      let sequences = await pg.sequences()
      expect(sequences.length).toBe(1)
      expect(sequences[0].source).toBe(pg.source)
      expect(sequences[0].seq).toBe('44')

      // Requesting a sequence for a second url, creates a new sequence
      // record with seq:0 and source: second-url
      const pg2 = new Pg(PG_URL, 'http://admin:pass@localhost:5984/secondpgdb')
      expect(await pg2.seq()).toBe(0)
      expect(await pg.seq()).toBe('44')
      sequences = await pg.sequences()
      expect(sequences.length).toBe(2)
      expect(sequences[0].source).toBe(pg.source)
      expect(pg.source).toBe('localhost:5984/something')
      expect(sequences[0].seq).toBe('44')
      expect(sequences[1].source).toBe(pg2.source)
      expect(pg2.source).toBe('localhost:5984/secondpgdb')
      expect(sequences[1].seq).toBe('0')
    })

    test('migration to an existing system', async() => {
      await migrate(PG_URL)
      let sequences = await pg.sequences()
      expect(sequences.length).toBe(0)

      await pg.db('couchdb_progress').insert({seq: '44', source: DEFAULT_DATABASE})

      await migrate(PG_URL)
      sequences = await pg.sequences()
      expect(sequences.length).toBe(1)
      expect(sequences[0].source).toBe(DEFAULT_DATABASE)
      expect(sequences[0].seq).toBe('44')
    })
  })
})
