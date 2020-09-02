const _ = require("lodash")

const timeUtils = require("../utils/time")

const BaseCommand = require("./BaseCommand")

class Unapproved extends BaseCommand {
  perform = () => {
    const promises = this.projects.map(this.__getUnapprovedRequests)

    return Promise.all(promises)
      .then(_.flatten)
      .then(requests => requests.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at)))
      .then(this.__buildMessage)
      .then(message => {
        this.logger.info("Sending message")
        this.logger.info(message)
        return message
      })
      .then(this.messenger.send)
  }

  __buildMessage = requests => {
    if (requests.length) {
      const list = requests.map(this.__buildRequestDescription).join("\n")
      const head = `#### Hey, there is a couple of requests waiting for your review`

      return `${head}\n\n${list}`
    } else {
      return [
        "#### Hey, there is a couple of nothing",
        "There are no pending requests! Let's do a new one!"
      ].join("\n\n")
    }
  }

  __buildRequestDescription = request => {
    const updated = new Date(request.updated_at)
    const reaction = this.__getEmoji(updated)

    const link = `[${request.title}](${request.web_url})`
    const author = `@${request.author.username}`
    const project = `[${request.project.name}](${request.project.web_url})`

    return `${reaction} **${link}** (${project}) by **${author}**`
  }

  __getEmoji = lastUpdate => {
    const emoji = _.get(this.config, "unapproved.emoji", {})
    const interval = new Date().getTime() - lastUpdate.getTime()

    const findEmoji = _.flow(
      _.partialRight(_.toPairs),
      _.partialRight(_.map, ([key, value]) => [timeUtils.parseInterval(key), value]),
      _.partialRight(_.sortBy, ([time]) => -time),
      _.partialRight(_.find, ([time]) => time < interval),
      _.partialRight(_.last),
    )

    return findEmoji(emoji) || emoji.default || ""
  }

  __getUnapprovedRequests = projectId => this.__getExtendedRequests(projectId)
    .then(requests => requests.filter(req => {
      const isCompleted = !req.work_in_progress
      const isUnapproved = req.approvals_left > 0
      const hasUnresolvedDiscussions = req.discussions.some(dis => {
        return dis.notes.some(note => note.resolvable && !note.resolved)
      })
      return isCompleted && (isUnapproved || hasUnresolvedDiscussions)
    }))

  __getExtendedRequests = projectId => this.gitlab
    .project(projectId)
    .then(project => this.gitlab.requests(project.id).then(requests => {
      const promises = requests.map(request => this.__getExtendedRequest(project, request))
      return Promise.all(promises)
    }))

  __getExtendedRequest = (project, request) => Promise.resolve(request)
    .then(req => this.__appendApprovals(project, req))
    .then(req => this.__appendDiscussions(project, req))
    .then(req => ({ ...req, project }))

  __appendApprovals = (project, request) => this.gitlab
    .approvals(project.id, request.iid)
    .then(approvals => ({ ...approvals, ...request }))

  __appendDiscussions = (project, request) => this.gitlab
    .discussions(project.id, request.iid)
    .then(discussions => ({ ...request, discussions }))
}

module.exports = Unapproved
