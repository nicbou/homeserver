#!/usr/bin/env bash
set -e
set -x

scripts_dir=$(dirname "$0")
today=$(date "+%Y-%m-%d")

echo -e "\033[1;32mCopying production DB\033[0m"

scp -P 2200 "root@home.nicolasbouliane.com:/var/homeserver/db-backups/backup-${today}.sql" "backup-${today}.sql"
bash "${scripts_dir}/restore-db.sh backup-${today}.sql"

echo -e "\033[1;32mCopying production uploads\033[0m"

rsync -avz -e 'ssh -p2200' root@home.nicolasbouliane.com:/media/external2/movies/library/*.jpg ../movies/library/
