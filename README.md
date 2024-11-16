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

## Issues

### What is tested and works

- DNS over HTTPS (tested in Firefox)
- DNS over UDP (tested with `dig` cli)

### What is tested and doesn't work

- DNS over TLS (tested in Android)

Probably because I setup the nginx proxy incorrectly.

Maybe because I should run it in a separate TCP server (on different port than the HTTP server).

### Workaround for Android

Use the app [Intra](https://play.google.com/store/apps/details?id=app.intra) to setup a local VPN, which forward the DNS requests to the DOH server.

## Development

The core files of DNS proxy is in [server/proxy](server/proxy) directory.

The web UI is powered by [ts-liveview](https://github.com/beenotung/ts-liveview/blob/v5-auth-web-template/README.md)

See [help.txt](help.txt) to get started.
