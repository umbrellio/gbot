const DIFF_INSERTION_REGEXP = /^\+/
const DIFF_DELETION_REGEXP = /^-/

const diffToNumericMap = diff => {
  const [, ...lines] = diff.split("\n")

  const numericMatch = (str, re) => (str.match(re) ? 1 : 0)

  return lines.map(line => {
    const isInsertion = numericMatch(line, DIFF_INSERTION_REGEXP)
    const isDeletion = numericMatch(line, DIFF_DELETION_REGEXP)

    return [isInsertion, isDeletion]
  })
}

module.exports = {
  diffToNumericMap,
}
