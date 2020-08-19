const _ = require("lodash")

const logger = require("../utils/logger")

const GitLab = require("../api/GitLab")
const Messenger = require("../api/Messenger")

class BaseCommand {
  constructor(config) {
    this.config = config
    this.logger = logger
    this.gitlab = new GitLab(config)
    this.messenger = new Messenger(config)

    this.projects = _.get(config, "gitlab.projects")
  }

  perform = () => {
    throw new Error("Not implemented")
  }
}

module.exports = BaseCommand
