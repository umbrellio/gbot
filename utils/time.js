const sec2ms = seconds => seconds * 1000

const min2ms = minutes => sec2ms(minutes * 60)

const hours2ms = hours => min2ms(hours * 60)

const days2ms = days => hours2ms(days * 24)

const parseInterval = string => {
  const match = string.match(/^(\d+)(s|m|h|d)$/)
  if (!match) return 0

  const [_, int, dimension] = match
  const interval = parseFloat(int)

  switch (dimension) {
    case "s": return sec2ms(interval)
    case "m": return min2ms(interval)
    case "h": return hours2ms(interval)
    case "d": return days2ms(interval)
  }
}

module.exports = {
  parseInterval,
}
