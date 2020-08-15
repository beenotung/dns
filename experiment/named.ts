let named = require('named')
let server = named.createServer()
let ttl = 300
let port = 30053
let host = '0.0.0.0'
server.listen(port, host, () => {
  console.log('DNS server started on port', port)
})
server.on('query', (query: any) => {
  const domain = query.name()
  console.log('DNS Query:', domain)
  const target = new named.SOARecord(domain, {serial: Date.now()})
  query.addAnswer(domain, target, ttl)
  server.send(query)
})
