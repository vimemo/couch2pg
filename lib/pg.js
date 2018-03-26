import R from 'ramda'
import connection from './pgconnection'
import format from 'pg-format'
import log from 'loglevel'

const stmts = {
        seq: 'SELECT seq FROM couchdb_progress WHERE dbid = %L',
  insertSeq: 'INSERT INTO couchdb_progress(seq, dbid) VALUES %L',
  updateSeq: 'UPDATE couchdb_progress SET seq = %L WHERE dbid = %L',
     insert: 'INSERT INTO couchdb (doc) VALUES %L',
     delete: 'DELETE FROM couchdb WHERE doc->>\'_id\' in (%L)',
      count: 'SELECT COUNT(*) FROM couchdb',
       docs: 'SELECT * FROM couchdb'
}

export default class Pg {
  constructor(url, dbid) {
    this.url = url
    this.db = connection(this.url)
    this.dbid = dbid
    if(!this.dbid){
      throw new Error('Identify the couchdb that will be replicated to this pg')
    }
  }

  async seq() {
    const seq = await this.db.raw(format(stmts.seq, this.dbid))
    if(seq.rowCount === 0) {
      await this.db('couchdb_progress').insert({seq: 0, dbid: this.dbid})
      return 0
    }
    return parseInt(seq.rows[0].seq)
  }

  async updateSeq(seq) {
    await this.seq() //creates sequence if it does not already exists
    return this.db.raw(format(stmts.updateSeq, seq, this.dbid));
  }

  delete(ids) {
    if (ids && ids.length) {
      return this.db.raw(format(stmts.delete, ids))
    }
  }

  async count() {
    const res = (await this.db.raw(stmts.count))
    return parseInt(res.rows[0].count)
  }

  async docs(sorted=false) {
    const rows = (await this.db.raw(stmts.docs)).rows
    if(sorted) {
      return R.sortBy(R.prop('_id'))(rows)
    }
    return rows
  }

  async insert(docs) {
    log.debug(`Inserting ${docs.length} results into postgresql`)
    let sql = format(stmts.insert, docs.map(row => [row]))

    // PostgreSQL doesn't support \u0000 in JSON strings, see:
    //   https://www.postgresql.org/message-id/E1YHHV8-00032A-Em@gemulon.postgresql.org
    // pg-format replaces any \uxxxx with \\\\uxxxx, which looks weird but
    // results ultimately in the data getting into pg correctly.
    sql = sql.replace(/\\\\u0000/g, '')
    return this.db.raw(sql)
  }

  async drop() {
    await this.db.schema.dropTableIfExists('couchdb')
    await this.db.schema.dropTableIfExists('couchdb_progress')
    await this.db.schema.dropTableIfExists('couch2pg_migrations')
  }

  async destroy() {
    await this.db.destroy()
  }
}
