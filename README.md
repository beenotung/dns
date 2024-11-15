# DNS (proxy)

A DNS proxy that logs and filters domain names before forwarding them to an upstream DNS server.

## Features

- Block certain domain names, e.g. ads, trackers, etc.
- Log all domain names requested
- Review domain names in a Web UI
- Toggle default behavior (block or forward)

## Process

**automated mode**:

1. Log all domain names requested
2. Block requests by domain name
3. Forward requests to an upstream DNS server

**review mode**:

1. Display recent requested domain names
2. Block/unblock domain names
