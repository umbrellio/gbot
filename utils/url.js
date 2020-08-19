const path = require("path")

const build = (...parts) => path.join(...parts.map(String))

module.exports = { build }
