#!/bin/bash
set -e
set -o pipefail
dig @127.0.0.1 -p 8053 google.com A
curl -i "http://127.0.0.1:8053/dns-query?dns=eU0BIAABAAAAAAABBmdvb2dsZQNjb20AAAEAAQAAKQTQAAAAAAAMAAoACBKJNjsAady6" --output out
