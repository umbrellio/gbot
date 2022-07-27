const _ = require("lodash")
const minimatch = require("minimatch")

const BaseCommand = require("./BaseCommand")
const UnapprovedRequestDescription = require("./unapproved/UnapprovedRequestDescription")

const logger = require("../utils/logger")
const markupUtils = require("../utils/markup")
const { NetworkError } = require("../utils/errors")

class Unapproved extends BaseCommand {
  perform = () => {
    return this.projects
      .then(projects => Promise.all(projects.map(this.__getUnapprovedRequests)))
      .then(requests => {
        return requests.flat().sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))
      })
      .then(this.__buildMessage)
      .then(message => {
        this.logger.info("Sending message")
        this.logger.info(JSON.stringify(message))
        return message
      })
      .then(this.messenger.send)
      .catch(err => {
        if (err instanceof NetworkError) {
          logger.error(err)
        } else {
          console.error(err) // eslint-disable-line no-console
        }

        process.exit(1)
      })
  }

  __buildMessage = requests => {
    const markup = markupUtils[this.config.messenger.markup]

    if (requests.length) {
      const list = requests.map(this.__buildRequestDescription).map(markup.addDivider)
      const headText = "Hey, there are a couple of requests waiting for your review"

      const header = markup.makeHeader(headText)
      const bodyParts = markup.flatten(list)

      return markup.composeMsg(header, bodyParts)
    } else {
      const headText = "Hey, there is a couple of nothing"
      const bodyText = "There are no pending requests! Let's do a new one!"

      const header = markup.makeHeader(headText)
      const body = markup.makePrimaryInfo(markup.makeText(bodyText))

      return markup.composeMsg(header, body)
    }
  }

  __buildRequestDescription = request => {
    const descriptionBuilder = new UnapprovedRequestDescription(request, this.config)

    return descriptionBuilder.build()
  }

  __getUnapprovedRequests = project => this.__getExtendedRequests(project.id)
    .then(requests => requests.filter(req => {
      const isCompleted = !req.work_in_progress
      const isUnapproved = req.approvals_left > 0
      const hasUnresolvedDiscussions = req.discussions.some(dis => {
        return dis.notes.some(note => note.resolvable && !note.resolved)
      })
      const hasPathsChanges = this.__hasPathsChanges(req.changes, project.paths)

      return isCompleted && hasPathsChanges && (isUnapproved || hasUnresolvedDiscussions)
    }))

  __hasPathsChanges = (changes, paths) => {
    if (_.isEmpty(paths)) {
      return true
    }

    return _.some(changes, change => (
      _.some(paths, path => (
        minimatch(change.old_path, path) || minimatch(change.new_path, path)
      ))
    ))
  }

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
