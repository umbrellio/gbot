const https = require("https")
const qs = require("querystring")
const url = require("url")

const logger = require("./logger")
const { NetworkError } = require("./errors")

const isErrorStatus = status => status >= 400

const getErrorMessage = ({ response, status, uri }) => {
  const message = response || `${status} Network Error`
  return `Got '${message}' message for '${uri}' request`
}

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
        const errorMessage = getErrorMessage({ response: data, status: resp.statusCode, uri })
        const error = new NetworkError(errorMessage, resp.statusCode)
        return reject(error)
      }

      json.headers = resp.headers
      resolve(json)
    })
  }).on("error", reject)
})

const post = (to, body, headers = {}) => new Promise((resolve, reject) => {
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
      ...headers,
    },
  }

  logger.debug(`POST ${to} ${data}`)
  const req = https.request(request, resp => {
    let data = ""
    resp.on("data", chunk => (data += chunk))
    resp.on("end", () => {
      if (isErrorStatus(resp.statusCode)) {
        const errorMessage = getErrorMessage({ response: data, status: resp.statusCode, uri })
        const error = new NetworkError(errorMessage, resp.statusCode)
        return reject(error)
      }

      resolve(data)
    })
  })

  req.on("error", reject)
  req.write(data)
  req.end()
})

module.exports = { get, post }
