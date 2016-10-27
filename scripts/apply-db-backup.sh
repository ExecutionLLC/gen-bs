#!/bin/bash

set -e

PG_PORT=${PG_PORT:-5432}
PG_HOST=${PG_HOST:-localhost}
PG_USER=${PG_USER:-postgres}

# $1 - path to the database backup to apply
PG_BACKUP_PATH=$1

# $2 - database name
PG_DATABASE=$2

# Create database
psql -U ${PG_USER} -h ${PG_HOST} --port ${PG_PORT} -c "CREATE DATABASE ${PG_DATABASE}" || (echo "Database ${PG_DATABASE} already exists, please delete it first." && exit 1)

# Restore backup
gunzip -c ${PG_BACKUP_PATH} | psql -h ${PG_HOST} -U ${PG_USER} --port ${PG_PORT} ${PG_DATABASE}

