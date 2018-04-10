import migrate from '../lib/pgmigration'
import Pouch from '../lib/Pouch'
import Pg from '../lib/Pg'
import pgconnection from '../lib/pgconnection'

import couchdocs from '../testutils/docs.json'

describe('pg', () => {
  const PG_URL = 'postgres://localhost:5432/pg-test'
  const pg = new Pg(PG_URL, 'xyz')

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
    const pg2 = new Pg(PG2_URL, 'abc')

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
})
