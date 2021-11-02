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
      const json = JSON.parse(data)

      if (isErrorStatus(resp.statusCode)) {
        const message = json.message || `${resp.statusCode} Network Error`
        const error = new Error(`Got '${message}' message for '${uri}' request`)
        return reject(error)
      }

      json.headers = resp.headers
      resolve(json)
    })
  }).on("error", reject)
})

const post = (to, body) => new Promise((resolve, reject) => {
  const uri = new url.URL(to)
  const data = JSON.stringify(body)
  const request = {
    host: uri.host,
    port: uri.port,
    path: uri.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
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
