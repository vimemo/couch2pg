import PouchDB from 'pouchdb'
import Pouch from '../lib/pouch'
import docs from './mocks/docs.json'

describe('couch', () => {
  const DB_NAME = 'couch-test'
  const COUCH_URL = `http://localhost:5984/${DB_NAME}`
  const pouch = new Pouch(COUCH_URL)

  const cleanUp = async () => await new PouchDB(COUCH_URL).destroy()

  beforeEach(async () => cleanUp())
  afterEach(() => cleanUp())

  describe('couch operations', () => {
    beforeEach(async () => await new PouchDB(COUCH_URL).bulkDocs(docs))

    test('empty constructor', () => {
      expect(() => new Pouch()).toThrowError(/Missing Parameter/)
      expect.assertions(1)
    })

    test('docs, sortedDocs, count', async () => {
      expect((await pouch.docs())[0].doc.rev).toBe(docs[0].doc.rev)
      expect((await pouch.sortedDocs())[0].doc.rev).toBe(docs[0].doc.rev)
      expect((await pouch.count()) === 2).toBe(true)
    })

    test('docs by keys', async () => {
      const saved = (await pouch.docs())[0]
      const doc = (await pouch.docs([saved._id]))[0]
      expect(doc.id).toEqual(saved.id)
    })

    test('getChanges limit 10', async () => {
      const changes = await pouch.changes(10, 0)
      expect(changes.length).toBe(2)
    })
  })
})
