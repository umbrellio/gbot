const _ = require("lodash")
const network = require("../utils/network")
const logger = require("../utils/logger")

class Messenger {
  constructor({ messenger }) {
    this.channel = _.get(messenger, "channel")
    this.webhook = _.get(messenger, "webhook")
    this.username = _.get(messenger, "sender.username", "Gbot")
    this.icon = _.get(messenger, "sender.icon", null)
  }

  send = text => {
    const message = {
      text,
      channel: this.channel,
      username: this.username,
      icon_url: this.icon
    }

    return network.post(this.webhook, message)
  }
}

module.exports = Messenger
