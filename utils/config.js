const _ = require("lodash")
const path = require("path")
const fs = require("fs")
const yaml = require("js-yaml")

const PREFIX_REGEX = /^GBOT_/

const defaultConfig = {
  messenger: {
    markup: "markdown",
  },
}

const parseEnvValue = value => {
  try {
    return JSON.parse(value)
  } catch (e) {
    return value
  }
}

const parseEnvKey = key => {
  return key.replace(PREFIX_REGEX, "").split("__").map(_.trim).map(_.camelCase)
}

const getFileConfig = filePath => {
  const configPath = path.resolve(filePath)
  const content = fs.readFileSync(configPath)
  return yaml.load(content)
}

const getEnvConfig = () => Object
  .entries(process.env)
  .reduce((mem, [key, value]) => {
    if (!PREFIX_REGEX.test(key)) return mem
    const keyPath = parseEnvKey(key)
    const parsedValue = parseEnvValue(value)
    return _.set(mem, keyPath, parsedValue)
  }, {})

const load = filePath => {
  const fileConfig = getFileConfig(filePath)
  const envConfig = getEnvConfig()

  return _.merge(defaultConfig, fileConfig, envConfig)
}

module.exports = { load }
