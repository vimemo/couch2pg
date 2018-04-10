import Couch2Pg from '../lib/couch2pg'
import Pouch, {mockDocs} from '../lib/pouch'
import Pg from '../lib/pg'
jest.mock('../lib/pouch', () => require('./__mocks/pouch'))
jest.mock('../lib/pg', () => require('./__mocks/pg'))

describe('importer', () => {
  let couch, pg

  beforeEach(() => {
    couch = new Pouch()
    pg = new Pg()
  })

  describe('Import changes batch', () => {
    test('gets rid of duplicates from changes feed', async () => {
      expect(await pg.seq()).toBe(0)
      await new Couch2Pg(couch, pg).replicate()
      expect(mockDocs).toHaveBeenCalledTimes(1)
      expect(mockDocs.mock.calls[0][0]).toEqual(['123'])
    })
  })
})
