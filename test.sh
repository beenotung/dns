#!/bin/bash
set -e
set -o pipefail
dig @127.0.0.1 -p 8080 google.com A