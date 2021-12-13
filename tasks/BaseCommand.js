const _ = require("lodash")

const logger = require("../utils/logger")

const GitLab = require("../api/GitLab")
const Messenger = require("../api/Messenger")

class BaseCommand {
  constructor (config) {
    this.config = config
    this.logger = logger
    this.gitlab = new GitLab(config)
    this.messenger = new Messenger(config)
  }

  perform = () => {
    throw new Error("Not implemented")
  }

  get projects () {
    const configProjects = _.get(this.config, "gitlab.projects", [])
    const groups = _.get(this.config, "gitlab.groups.list", [])

    if (_.isEmpty(configProjects) && _.isEmpty(groups)) {
      throw new Error("You should provide projects or groups in your config")
    }

    if (_.isEmpty(groups)) return Promise.resolve(configProjects)

    const promises = groups.map(group => {
      return this.gitlab.groupProjects(group).then(groupProjects => {
        const excludeProjects = _.get(this.config, "gitlab.groups.excludeProjects", [])
        const filteredGroupProjects = groupProjects.filter(p => !excludeProjects.includes(p))
        return _.uniq([...configProjects, ...filteredGroupProjects])
      })
    })

    return Promise.all(promises).then(projects => projects.flat())
  }
}

module.exports = BaseCommand
