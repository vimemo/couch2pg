import R from 'ramda'
import log from 'loglevel'

const CHANGES_LIMIT = 10000
const BATCH_LIMIT = 100

const uniqueDocIds = R.compose(
  R.pluck('id'),
  R.uniqBy(R.prop('id'))
)

export default class Couch2Pg {
  constructor(couch, pg) {
    this.couch = couch
    this.pg = pg
  }

  async replicate(changesLimit=CHANGES_LIMIT, batchLimit=BATCH_LIMIT) {
    const seq = await this.pg.seq()
    const [changes, lastSeq] = await this.couch.changes(changesLimit, seq)
    log.debug('Pulled ' + changes.length + ' results from couchdb')
    await this.replicateBatch(changes, batchLimit)
    await this.pg.updateSeq(lastSeq)
  }

  async replicateBatch(changes, batchLimit) {
    if (changes.length) {
      const batch = changes.splice(0, batchLimit)
      const [deleted, edited] = R.partition(R.prop('deleted'), batch)
      const docs = await this.couch.docs(uniqueDocIds(edited))
      await this.pg.delete(uniqueDocIds(deleted))
      await this.pg.insert(docs)
      await this.replicateBatch(changes, batchLimit)
    }
  }
}
