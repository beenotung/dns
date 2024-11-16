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
  source ~/.nvm/nvm.sh
  set -x
  cd $project_dir
  pnpm install --prod
  pm2 reload dns
"
