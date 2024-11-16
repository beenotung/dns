#!/bin/bash
# ssh login for manual deploy setup (e.g. to setup nginx and run seed)
set -e
set -o pipefail

source scripts/config

ssh -t "$server" "
  if [ -d $project_dir ]; then
    cd $project_dir
  fi
  \$0 --login
"
