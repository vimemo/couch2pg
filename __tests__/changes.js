import _ from 'underscore'
import R from 'ramda'

// Just to start the conversation about
// underscore/ramda choice
describe('underscore vs ramda', () => {
  let docs = null
  beforeEach(() =>{
    docs = [
      {id: 1, deleted: true},
      {id: 2, simon: '1'},
      {id: 3, simona: '2'},
      {id: 4, deleted: true}]
  })

  test('using underscore', () => {
    const [deletes, edits] = _.partition(docs, doc => doc.deleted)
    const docsToDelete   = _.uniq(deletes, _.property('id')),
        docsToDownload = _.uniq(edits, _.property('id'))

    const deletedDocIds = _.pluck(docsToDelete, 'id')
    const editedDocIds = _.pluck(docsToDownload, 'id')
    expect(deletedDocIds).toEqual([1,4])
    expect(editedDocIds).toEqual([2,3])
  })

  test('using ramda', () => {
    const [deletes, edits] = R.partition(R.prop('deleted'), docs)

    const uniqueIds = (docs) => R.compose(
      R.pluck('id'),
      R.uniqBy(R.prop('id'))
    )(docs)

    expect(uniqueIds(deletes)).toEqual([1,4])
    expect(uniqueIds(edits)).toEqual([2,3])
  })
})
