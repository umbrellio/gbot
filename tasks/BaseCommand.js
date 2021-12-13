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
    const groups = _.get(this.config, "gitlab.groups")

    if (_.isEmpty(configProjects) && _.isEmpty(groups)) {
      throw new Error("You should provide projects or groups in your config")
    }

    if (_.isEmpty(groups)) return Promise.resolve(configProjects)

    const promises = groups.map(group => {
      return this.gitlab.groupProjects(group.id).then(groupProjects => {
        const excludeProjects = group.excluded || []
        return groupProjects.filter(p => !excludeProjects.includes(p))
      })
    })

    return Promise.all(promises)
      .then(projects => _.uniq([...configProjects, ...projects.flat()]))
  }
}

module.exports = BaseCommand
