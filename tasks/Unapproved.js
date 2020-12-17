const _ = require("lodash")

const BaseCommand = require("./BaseCommand")
const UnapprovedRequestDescription = require("./unapproved/UnapprovedRequestDescription")

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
      const head = "#### Hey, there are a couple of requests waiting for your review"

      return `${head}\n\n${list}`
    } else {
      return [
        "#### Hey, there is a couple of nothing",
        "There are no pending requests! Let's do a new one!"
      ].join("\n\n")
    }
  }

  __buildRequestDescription = request => {
    const descriptionBuilder = new UnapprovedRequestDescription(request, this.config)

    return descriptionBuilder.build()
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
    .then(req => this.__appendChanges(project, req))
    .then(req => this.__appendDiscussions(project, req))
    .then(req => ({ ...req, project }))

  __appendApprovals = (project, request) => this.gitlab
    .approvals(project.id, request.iid)
    .then(approvals => ({ ...approvals, ...request }))

  __appendChanges = (project, request) => this.gitlab
    .changes(project.id, request.iid)
    .then(changes => ({ ...changes, ...request }))

  __appendDiscussions = (project, request) => this.gitlab
    .discussions(project.id, request.iid)
    .then(discussions => ({ ...request, discussions }))
}

module.exports = Unapproved
