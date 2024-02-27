const _ = require("lodash")
const network = require("../utils/network")

class Messenger {
  constructor ({ messenger }) {
    this.channel = _.get(messenger, "channel")
    this.webhook = _.get(messenger, "webhook")
    this.username = _.get(messenger, "sender.username", "Gbot")
    this.icon = _.get(messenger, "sender.icon", null)
  }

  send = message => {
    const content = {
      ...message,
      channel: this.channel,
      username: this.username,
      icon_url: this.icon,
    }

    return network.post(this.webhook, content)
  }

  sendMany = messages => Promise.all(
    _.castArray(messages).map(message => this.send(message)),
  )
}

module.exports = Messenger
