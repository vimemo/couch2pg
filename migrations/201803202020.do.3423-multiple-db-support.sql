alter table couchdb_progress add column dbid varchar;
CREATE UNIQUE INDEX couchdb_progress_dbid ON couchdb_progress ( dbid );
