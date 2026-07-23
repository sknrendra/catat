#!/bin/sh
set -e

node scripts/migrate.mjs

exec "$@"
