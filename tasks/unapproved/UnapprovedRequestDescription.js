const _ = require("lodash")
const gitUtils = require("../../utils/git")
const timeUtils = require("../../utils/time")
const stringUtils = require("../../utils/strings")

class UnapprovedRequestDescription {
  constructor(request, config) {
    this.config = config
    this.request = request
  }

  build = () => {
    const updated = new Date(this.request.updated_at)
    const reaction = this.__getEmoji(updated)

    const link = `[${this.request.title}](${this.request.web_url})`
    const author = this.__authorString()
    const project = `[${this.request.project.name}](${this.request.project.web_url})`
    const unresolvedAuthors = this.__unresolvedAuthorsString()
    const approvedBy = this.__approvedByString()
    const optionalDiff = this.__optionalDiffString()

    const parts = [reaction, optionalDiff, `**${link}**`, `(${project})`, `by **${author}**`]

    let message = [_.compact(parts).join(" ")]

    if (unresolvedAuthors.length > 0) {
      message.push(`unresolved threads by: ${unresolvedAuthors}`)
    }
    if (approvedBy.length > 0) {
      message.push(`already approved by: ${approvedBy}`)
    }

    return message.join("\n")
  }

  __getConfigSetting = (settingName, defaultValue = null) => {
    return _.get(this.config, settingName, defaultValue)
  }

  __getEmoji = lastUpdate => {
    const emoji = this.__getConfigSetting("unapproved.emoji", {})
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

  __unresolvedAuthorsString = () => {
    return this.__unresolvedAuthorsFor(this.request).map(author => {
      return `@${author.username}`
    }).join(", ")
  }

  __approvedByString = () => {
    const tagApprovers = this.__getConfigSetting("unapproved.tag.approvers", false)

    return this.request.approved_by.map(approve => {
      const { user } = approve
      let message = `@${user.username}`

      if (!tagApprovers) {
        message = stringUtils.wrapString(message)
      }

      return message
    }).join(", ")
  }

  __authorString = () => {
    const tagAuthor = this.__getConfigSetting("unapproved.tag.author", false)
    let message = `@${this.request.author.username}`

    if (!tagAuthor) {
      message = stringUtils.wrapString(message)
    }
    return message
  }

  __optionalDiffString = () => {
    const showDiff = this.__getConfigSetting("unapproved.diffs", false)

    if (showDiff) {
      const [ insertions, deletions ] = this.__getTotalDiff()

      return stringUtils.wrapString(`+${insertions} -${deletions}`)
    }

    return ""
  }

  __unresolvedAuthorsFor = () => {
    const tagCommenters = this.__getConfigSetting("unapproved.tag.commenters", false)

    const { discussions } = this.request

    const selectNotes = discussion => {
      const [issueNote, ...comments] = discussion.notes

      return tagCommenters ? [issueNote, ...comments] : [issueNote]
    }

    const userNames = _.flow(
      _.partialRight(
        _.filter,
        discussion => discussion.notes.some(
          note => note.resolvable && !note.resolved
        )
      ),
      _.partialRight(_.map, selectNotes),
      _.partialRight(
        _.map,
        notes => notes.map(note => note.author)
      ),
      _.partialRight(_.flatten),
      _.partialRight(
        _.uniqBy,
        author => author.username
      ),
    )

    return userNames(discussions)
  }

  __getTotalDiff = () => {
    const { changes } = this.request

    const mapDiffs = ({ diff }) => gitUtils.diffToNumericMap(diff)

    return _.flow(
      _.partialRight(_.map, mapDiffs),
      _.flatten,
      _.unzip,
      _.partialRight(_.map, _.sum),
    )(changes)
  }
}

module.exports = UnapprovedRequestDescription
