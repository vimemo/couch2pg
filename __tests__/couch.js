import Couch from '../lib/couch'
import PouchDB from 'pouchdb'
import couchDocs from '../testutils/docs.json'

describe('couch', () => {
  const DB_NAME = 'couch-test'
  const COUCH_URL = `http://admin:pass@localhost:5984/${DB_NAME}`
  const couch = new Couch(COUCH_URL)

  const DOCS_TO_CREATE = 2

  const cleanUp = async () => await new PouchDB(COUCH_URL).destroy()

  beforeEach(async () => {
    cleanUp()
    await new PouchDB(COUCH_URL).bulkDocs(couchDocs)
  })

  afterEach(() => cleanUp())

  test('docs, count', async () => {
    const docs = await couch.docs()
    expect(docs[0].doc.rev).toBe(couchDocs[0].doc.rev)
    expect((await couch.count()) === 2).toBe(true)
  })

  test('getChanges', async () => {
    const changes = await couch.changes(0)
    expect(changes.length).toBe(2)
  })
})
