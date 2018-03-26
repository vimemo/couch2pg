import R from 'ramda'
import PouchDB from 'pouchdb'

const throwIfMissing = () => { throw new Error('Missing Parameter') }

export default class Couch {

  /**
   * Abstraction for replication source db.
   *
   * @constructor
   *
   * @param {String} url
   *   couch url
   */
  constructor(url=throwIfMissing()) {
    this.url = url
    this.db = new PouchDB(url)
  }

  async docs(keys=null, sorted=false) {
    const prop = !keys ? {include_docs: true} : {include_docs: true, keys: keys}
    const rows = (await this.db.allDocs(prop)).rows
    const docs = R.pluck('doc', rows)
    return sorted ? R.sortBy(R.prop('_id'), docs) : docs
  }

  sortedDocs() {
    return this.docs(null, true)
  }

  async count() {
    return (await this.docs()).length
  }

  async changes(limit, seq) {
    const res = await this.db.changes({limit: limit, since: seq})
    return [res.results, res.last_seq]
  }
}
