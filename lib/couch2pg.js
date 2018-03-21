import R from 'ramda'

const CHANGES_LIMIT = 10000
const BATCH_LIMIT = 100

const docIds = (docs) => R.compose(
  R.pluck('id'),
  R.uniqBy(R.prop('id'))
)(docs)

export default class Couch2Pg {
  constructor(couch, pg) {
    this.couch = couch
    this.pg = pg
  }

  async replicate(changesLimit=CHANGES_LIMIT, batchLimit=BATCH_LIMIT) {
    const seq = await this.pg.seq()
    const changes = await this.couch.changes(seq, changesLimit)
    await this.replicateBatch(changes, batchLimit)
  }

  async replicateBatch(changes, batchLimit) {
    if (changes.length) {
      const batch = changes.splice(0, batchLimit)
      const docs = await this.couch.docsByIds(R.pluck('id', batch))
      const [deleted, edited] = R.partition(R.prop('deleted'), batch)

      await this.pg.delete(docIds(deleted))
      await this.pg.insert(edited)
      await this.replicateBatch(changes, batchLimit)
    }
  }
}
