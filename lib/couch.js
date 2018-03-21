import R from 'ramda'
import log from 'loglevel'
import PouchDB from 'pouchdb'

export default class Couch {
  constructor(url) {
    this.url = url
    this.db = new PouchDB(url)
  }

  async docs() {
    const docs = (await this.db.allDocs({include_docs: true})).rows
    return R.pluck('doc', docs)
  }

  async docsByIds(ids) {
    return (await this.db.allDocs({include_docs: true, keys: ids})).rows
  }

  async count() {
    return (await this.docs()).length
  }

  async changes(seq, limit) {
    const res = (await this.db.changes({limit: limit, since: seq})).results
    log.debug('Pulled ' + res.length + ' results from couchdb')
    return res
  }
}
