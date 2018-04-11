import {sortBy, path, pluck} from 'ramda'
import connection from './pgconnection'
import format from 'pg-format'
import log from 'loglevel'
import parser from 'url'

export const DEFAULT_SOURCE = 'default-source'
export const REPLICATION_DB = 'couchdb'
export const SEQUENCE_DB = 'couchdb_progress'
export const MIGRATIONS_DB = 'couch2pg_migrations'

const parseSource = url => {
  const source = parser.parse(url)
  return `${source.host}${source.path}`
}

const stmts = {
  seq:        `SELECT seq FROM ${SEQUENCE_DB} WHERE source = %L`,
  insertSeq:  `INSERT INTO ${SEQUENCE_DB}(seq, source) VALUES %L`,
  updateSeq:  `UPDATE ${SEQUENCE_DB} SET seq = %L WHERE source = %L`,
  updateDefaultSeq: `UPDATE ${SEQUENCE_DB} SET source = %L WHERE source = %L`,
  selectSeqs: `select * from ${SEQUENCE_DB}`,
  insert:     `INSERT INTO ${REPLICATION_DB} (doc) VALUES %L`,
  delete:     `DELETE FROM ${REPLICATION_DB} WHERE doc->>\'_id\' in (%L)`,
  count:      `SELECT COUNT(*) FROM ${REPLICATION_DB}`,
  docs:       `SELECT * FROM ${REPLICATION_DB}`
}

const throwIfMissing = () => { throw new Error('Missing Parameter') }

export default class Pg {
  constructor(url=throwIfMissing(), sourceUrl=throwIfMissing()) {
    this.url = url
    this.db = connection(this.url)
    this.sourceUrl = sourceUrl
    this.source = parseSource(sourceUrl)
  }

  async seq() {
    // Find sequence for this source
    let seq = await this.db.raw(format(stmts.seq, this.source))
    if(seq.rowCount > 0) {
      return seq.rows[0].seq
    }
    // Find sequence for default source
    seq = await this.db.raw(format(stmts.seq, DEFAULT_SOURCE))
    if(seq.rowCount > 0) { //default-source exists
      await this.db.raw(format(stmts.updateDefaultSeq, this.source, DEFAULT_SOURCE))
      return seq.rows[0].seq
    }
    await this.db(SEQUENCE_DB).insert({seq: 0, source: this.source})
    return 0
  }

  async updateSeq(seq) {
    await this.seq() //creates sequence if it does not already exists
    return this.db.raw(format(stmts.updateSeq, seq, this.source))
  }

  async sequences() {
    return (await this.db.raw(stmts.selectSeqs)).rows
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
    return sorted ? sortBy(path(['doc', '_id']), rows) : rows
  }

  async sortedDocs() {
    return pluck('doc', await this.docs(true))
  }

  async insert(docs) {
    log.debug(`Inserting ${docs.length} results into postgresql`)
    let sql = format(stmts.insert, docs.map(row => [row.doc || row]))

    // PostgreSQL doesn't support \u0000 in JSON strings, see:
    //   https://www.postgresql.org/message-id/E1YHHV8-00032A-Em@gemulon.postgresql.org
    // pg-format replaces any \uxxxx with \\\\uxxxx, which looks weird but
    // results ultimately in the data getting into pg correctly.
    sql = sql.replace(/\\\\u0000/g, '')
    return this.db.raw(sql)
  }

  async drop() {
    await this.db.schema.dropTableIfExists(REPLICATION_DB)
    await this.db.schema.dropTableIfExists(SEQUENCE_DB)
    await this.db.schema.dropTableIfExists(MIGRATIONS_DB)
  }

  async destroy() {
    await this.db.destroy()
  }
}
