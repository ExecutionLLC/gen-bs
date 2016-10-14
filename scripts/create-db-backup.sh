#!/bin/bash

DATE_POSTFIX=$(date +%Y%m%dT%H%M%S)

PG_PORT=${PG_PORT:-5432}
PG_HOST=${PG_HOST:-localhost}
PG_USER=${PG_USER:-postgres}
PG_DATABASE=${PG_DATABASE:-genomixdb}
PG_BACKUP_PATH=${PG_BACKUP_PATH:-./database-backup-${DATE_POSTFIX}.sql.gz}

pg_dump --port=${PG_PORT} -h ${PG_HOST} -U ${PG_USER} ${PG_DATABASE} | gzip > ${PG_BACKUP_PATH}

