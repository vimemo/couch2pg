import Couch2Pg from '../lib/couch2pg'
import Couch, {mockDocsByIds} from '../lib/couch'
import Pg from '../lib/pg'
jest.mock('../lib/couch', () => require('./__mocks/couch'))
jest.mock('../lib/pg', () => require('./__mocks/pg'))

describe('importer', () => {
  let couch, pg

  beforeEach(() => {
    couch = new Couch()
    pg = new Pg()
  })

  describe('Import changes batch', () => {
    test('gets rid of duplicates from changes feed', async () => {
      expect(await pg.seq()).toBe(0)
      await new Couch2Pg(couch, pg).replicate()
      expect(mockDocsByIds).toHaveBeenCalledTimes(1)
      expect(mockDocsByIds.mock.calls[0][0]).toEqual(['123'])
    })
  })
})
