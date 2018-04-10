delete from couchdb_progress where seq = '0';
alter table couchdb_progress add column source varchar;
update couchdb_progress set source='default-source' where source is null;
ALTER TABLE couchdb_progress ALTER COLUMN source SET NOT NULL;
CREATE UNIQUE INDEX couchdb_progress_source ON couchdb_progress ( source );
