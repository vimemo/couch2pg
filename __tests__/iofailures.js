import Couch2Pg from '../lib/couch2pg'
import Pouch from '../lib/pouch'
import Pg from '../lib/pg'

jest.mock('../lib/pouch', () => require('./__mocks/pouch'))
jest.mock('../lib/pg', () => require('./__mocks/pg'))

describe('IO failure propagation', () => {

  test('accessing seq from postgres', async () => {
    Pg.mockImplementationOnce(() => {
      return {
        seq: () => { throw new Error('seq') }
      }})
    const couch2pg = new Couch2Pg(null, new Pg())
    await expect(couch2pg.replicate()).rejects.toEqual(Error('seq'))
  })

  test('accessing changes from couchdb', async () => {
    Pouch.mockImplementationOnce(() => {
      return {
        changes: () => { throw new Error('changes') }
      }})

    const couch2pg = new Couch2Pg(new Pouch(), new Pg())
    await expect(couch2pg.replicate()).rejects.toEqual(Error('changes'))
  })

  test('accessing allDocs from couchdb', async () => {
    Pouch.mockImplementationOnce(() => {
      return {
        docs: () => { throw new Error('docs') },
        changes: () => {
          return [
            [ {id:1, seq: 1}, {id:2, deleted: true, seq: 2} ],
            2
          ]
        }}})
    const couch2pg = new Couch2Pg(new Pouch(), new Pg())
    await expect(couch2pg.replicate()).rejects.toEqual(Error('docs'))
  })

  test('attempting to delete docs', async () => {
    const mockDocs = jest.fn()
    Pouch.mockImplementationOnce(() => {
      return {
        docs: mockDocs,
        changes: () => {
          return [[ {id:10, seq: 1}, {id:2, deleted: true, seq: 2}], 2]
        }}})
    Pg.mockImplementationOnce(() => {
      return {
        seq: () => 0,
        delete: () => { throw new Error('delete') }
      }})
    const couch2pg = new Couch2Pg(new Pouch(), new Pg())
    await expect(couch2pg.replicate()).rejects.toEqual(Error('delete'))
    expect(mockDocs).toHaveBeenCalledTimes(1)
    expect(mockDocs.mock.calls[0][0]).toEqual([10])
  })

  test('trying to delete existing docs before adding them', async () => {
    const mockDocs = jest.fn()
    Pouch.mockImplementationOnce(() => {
      return {
        docs: mockDocs,
        changes: () => {
          return [[ {id:1, seq: 1}, {id:2, deleted: true, seq: 2}], 2]
        }}})

    Pg.mockImplementationOnce(() => {
      return {
        seq: () => 0,
        delete: () => {  },
        insert: () => { throw new Error('deleting stub') }}})

    // TODO verify this
    // var dbQuery = sinon.stub(db, 'query')
    // dbQuery.onCall(1).returns(failedPromise('Deleting stub to store'))

    const couch2pg = new Couch2Pg(new Pouch(), new Pg())
    await expect(couch2pg.replicate()).rejects.toEqual(Error('deleting stub'))
  })

  test('adding docs', async () => {
    Pg.mockImplementationOnce(() => {
      return {
        seq: () => 0,
        delete: () => {},
        insert: () => { throw new Error('insert') }
      }})

    // TODO verify this
    // dbQuery.onCall(1).returns(successfulPromise())
    // dbQuery.withArgs(sinon.match(/INSERT INTO couchdb/)).returns(failedPromise('insert docs'))
    const couch2pg = new Couch2Pg(new Pouch(), new Pg())
    await expect(couch2pg.replicate()).rejects.toEqual(Error('insert'))
  })

})
