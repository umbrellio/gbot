const _ = require("lodash")
const gitUtils = require("../../utils/git")
const timeUtils = require("../../utils/time")
const stringUtils = require("../../utils/strings")
const markupUtils = require("../../utils/markup")

class UnapprovedRequestDescription {
  constructor (request, config) {
    this.config = config
    this.request = request
  }

  build = () => {
    const markup = markupUtils[this.config.messenger.markup]
    const tagAuthor = this.__getConfigSetting("unapproved.tag.author", false)
    const tagOnThreadsOpen = this.__getConfigSetting("unapproved.tag.onThreadsOpen", false)

    const { author, updated } = this.request

    const reaction = this.__getEmoji(new Date(updated))
    const link = markup.makeLink(this.request.title, this.request.web_url)
    const projectLink = markup.makeLink(this.request.project.name, this.request.project.web_url)
    const unresolvedAuthors = this.__unresolvedAuthorsString()
    const tagAuthorOnThread = tagOnThreadsOpen && unresolvedAuthors.length > 0
    const authorString = this.__authorString(
      markup, author.username, { tag: tagAuthor || tagAuthorOnThread },
    )
    const approvedBy = this.__approvedByString()
    const optionalDiff = this.__optionalDiffString()

    const requestMessageParts = [
      reaction,
      markup.makeBold(link),
      `(${projectLink})`,
      optionalDiff,
      `by ${authorString}`,
    ]
    const requestMessageText = _.compact(requestMessageParts).join(" ")
    const primaryMessage = markup.makePrimaryInfo(
      markup.makeText(requestMessageText, { withMentions: false }),
    )
    const secondaryMessageParts = []

    if (unresolvedAuthors.length > 0) {
      const text = `unresolved threads by: ${unresolvedAuthors}`
      const msg = markup.makeText(text, { withMentions: tagOnThreadsOpen })

      secondaryMessageParts.push(msg)
    }

    if (approvedBy.length > 0) {
      const text = `already approved by: ${approvedBy}`
      const msg = markup.makeText(text, { withMentions: false })

      secondaryMessageParts.push(msg)
    }

    const secondaryMessage = markup.makeAdditionalInfo(secondaryMessageParts)
    return markup.composeBody(primaryMessage, secondaryMessage)
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
    return this.__unresolvedAuthorsFor(this.request).map(author => (
      this.__authorString(author.username, { tag: true })
    )).join(", ")
  }

  __approvedByString = () => {
    const tag = this.__getConfigSetting("unapproved.tag.approvers", false)

    return this.request.approved_by.map(approve => (
      this.__authorString(approve.user.username, { tag })
    )).join(", ")
  }

  __authorString = (markup, username, { tag = false } = {}) => {
    if (tag) {
      return this.__getSlackMentionString(username)
    }

    return stringUtils.wrapString(username)
  }

  __getSlackMentionString = username => {
    const mapping = this.__getConfigSetting("messenger.usernameToSlackIDMapping", {})

    const id = mapping[username]
    if (!id) return username

    return `<@${id}>`
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
          note => note.resolvable && !note.resolved,
        ),
      ),
      _.partialRight(_.map, selectNotes),
      _.partialRight(
        _.map,
        notes => notes.map(note => note.author),
      ),
      _.partialRight(_.flatten),
      _.partialRight(
        _.uniqBy,
        author => author.username,
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
