#!/bin/bash
set -e
set -o pipefail
set -x

source scripts/config

npm run build

rsync -SavLP \
  package.json \
  dist \
  $server:$project_dir/

ssh $server "
  set -e
  source ~/.nvm/nvm.sh
  set -x
  cd $project_dir
  pnpm install --prod
  cd dist
  npx knex migrate:latest
  cd ..
  node dist/src/seed.js
  pm2 reload dns
"
