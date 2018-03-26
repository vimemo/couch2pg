import PouchDB from 'pouchdb'
import Couch from '../lib/couch'
import docs from '../testutils/docs.json'

describe('couch', () => {
  const DB_NAME = 'couch-test'
  const COUCH_URL = `http://admin:pass@localhost:5984/${DB_NAME}`
  const couch = new Couch(COUCH_URL)

  const cleanUp = async () => await new PouchDB(COUCH_URL).destroy()

  beforeEach(async () => cleanUp())
  afterEach(() => cleanUp())

  describe('couch operations', () => {
    beforeEach(async () => await new PouchDB(COUCH_URL).bulkDocs(docs))

    test('empty constructor', () => {
      expect(() => new Couch()).toThrowError(/Missing Parameter/)
      expect.assertions(1)
    })

    test('docs, count', async () => {
      expect((await couch.docs())[0].doc.rev).toBe(docs[0].doc.rev)
      expect((await couch.count()) === 2).toBe(true)
    })

    test('docs by keys', async () => {
      const saved = (await couch.docs())[0]
      const doc = (await couch.docs([saved._id]))[0]
      expect(doc.id).toEqual(saved.id)
    })

    test('getChanges limit 10', async () => {
      const changes = await couch.changes(10, 0)
      expect(changes.length).toBe(2)
    })
  })
})
