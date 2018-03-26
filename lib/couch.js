import R from 'ramda'
import PouchDB from 'pouchdb'

export default class Couch {
  constructor(url) {
    this.url = url
    this.db = new PouchDB(url)
  }

  async docs(keys=null, sorted=false) {
    const prop = !keys ? {include_docs: true} : {include_docs: true, keys: keys}
    const rows = (await this.db.allDocs(prop)).rows
    let docs = R.pluck('doc', rows)
    return sorted ? R.sortBy(R.prop('_id'), docs) : docs
  }

  async count() {
    return (await this.docs()).length
  }

  async changes(limit, seq) {
    const res = await this.db.changes({limit: limit, since: seq})
    return [res.results, res.last_seq]
  }
}
