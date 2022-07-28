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
    const groups = _.get(this.config, "gitlab.groups", [])

    if (_.isEmpty(configProjects) && _.isEmpty(groups)) {
      throw new Error("You should provide projects or groups in your config")
    }

    if (_.isEmpty(groups)) return Promise.resolve(configProjects)

    const promises = groups.map(({ id, excluded = [] }) => (
      this.gitlab.groupProjects(id).then(groupProjects => (
        groupProjects.filter(p => !excluded.includes(p))
      ))
    ))

    const mergeProjects = _.flow([
      groupProjects => groupProjects.flat().map(id => ({ id })),
      groupProjects => [...configProjects, ...groupProjects],
      totalProjects => _.uniqBy(totalProjects, ({ id }) => id),
    ])

    return Promise.all(promises).then(mergeProjects)
  }
}

module.exports = BaseCommand
