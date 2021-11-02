const https = require("https")
const qs = require("querystring")
const url = require("url")

const logger = require("./logger")

const isErrorStatus = status => status >= 400

const get = (uri, params = {}, headers = {}) => new Promise((resolve, reject) => {
  const query = qs.stringify(params)
  const options = { headers }

  logger.debug(`GET ${uri}?${query}`)
  https.get(`${uri}?${query}`, options, resp => {
    let data = ""

    resp.on("data", chunk => (data += chunk))
    resp.on("end", () => {
      let json = JSON.parse(data)

      if (isErrorStatus(resp.statusCode)) {
        const message = json.message || `${resp.statusCode} Network Error`
        return reject(`Got '${message}' message for '${uri}' request`)
      }

      json.headers = resp.headers
      resolve(json)
    })
  }).on("error", reject)
})

const post = (to, body) => new Promise((resolve, reject) => {
  const uri = url.parse(to)
  const data = JSON.stringify(body)
  const request = {
    ...uri,
    host: uri.host,
    port: uri.port,
    path: uri.path,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    }
  }

  logger.debug(`POST ${to} ${data}`)
  const req = https.request(request, resp => {
    let data = ""
    resp.on("data", chunk => (data += chunk))
    resp.on("end", () => {
      resolve(data)
    })
  })

  req.on("error", reject)
  req.write(data)
  req.end()
})

module.exports = { get, post }
