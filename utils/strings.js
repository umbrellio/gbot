const wrapString = (string, wrapper = "`") => {
  return `${wrapper}${string}${wrapper}`
}

module.exports = {
  wrapString,
}
