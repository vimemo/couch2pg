import Postgrator from 'postgrator'
import log from 'loglevel'

const SCHEMA_TABLE = 'couch2pg_migrations'
const MIGRATION_DIR = '../migrations'
const MIGRATION_VERSION = '201803202020'
const LOG_LEVEL = log.levels.DEBUG

export default (url) => {
  const postgrator = new Postgrator({
    migrationDirectory: `${__dirname}/${MIGRATION_DIR}`,
    schemaTable: SCHEMA_TABLE,
    driver: 'pg',
    logProgress: log.getLevel() <= LOG_LEVEL,
    connectionString: url
  })
  return postgrator.migrate(MIGRATION_VERSION)
}
