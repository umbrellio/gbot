class NetworkError extends Error {
  constructor (message, status) {
    super(message)
    this.name = "NetworkError"
    this.status = status
  }
}

module.exports = {
  NetworkError,
}
