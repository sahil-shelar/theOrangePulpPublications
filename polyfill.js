const fetch = require('node-fetch')
const WebSocket = require('ws')
if (!global.fetch) {
  global.fetch = fetch
  global.Headers = fetch.Headers
  global.Request = fetch.Request
  global.Response = fetch.Response
}
if (!global.WebSocket) {
  global.WebSocket = WebSocket
}
