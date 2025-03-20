const _ = require("lodash")

const markdown = {
  type: "markdown",
  makeLink: (title, url) => `[${title}](${url})`,
  makeText: text => text,
  makePrimaryInfo: info => info,
  makeAdditionalInfo: parts => parts.join("\n"),
  makeBold: content => `**${content}**`,
  makeHeader: text => `#### ${text}`,
  mention: (username, _mapping) => `@${username}`,
  addDivider: parts => `${parts} \n`,
  flatten: parts => parts.join("\n"),
  withHeader: (header, body) => `${header}\n\n${body}`,
  composeBody: (main, secondary) => _.compact([main, secondary]).join("\n"),
  composeMsg: body => ({ text: body }),
}

const slackText = {
  type: "slackText",
  makeLink: (title, url) => `<${url}|${title}>`,
  makeText: text => text,
  makePrimaryInfo: info => info,
  makeAdditionalInfo: parts => parts.join("\n"),
  makeBold: content => `*${content}*`,
  makeHeader: text => `*${text}*`,
  mention: (username, mapping) => (
    mapping[username] ? `<@${mapping[username]}>` : `@${username}`
  ),
  addDivider: parts => `${parts} \n`,
  flatten: parts => parts.join("\n"),
  withHeader: (header, body) => `${header}\n\n${body}`,
  composeBody: (main, secondary) => _.compact([main, secondary]).join("\n"),
  composeMsg: body => ({ text: body }),
}

const slack = {
  type: "slack",
  makeLink: (title, url) => `<${url}|${title}>`,
  makePrimaryInfo: info => ({
    type: "section",
    text: info,
  }),
  makeAdditionalInfo: parts => (_.isEmpty(parts) ? null : ({
    type: "context",
    elements: parts,
  })),
  makeText: (text, { withMentions = true } = {}) => ({
    type: "mrkdwn",
    text,
    verbatim: !withMentions,
  }),
  makeBold: content => `*${content}*`,
  makeHeader: text => ({
    type: "header",
    text: {
      type: "plain_text",
      text,
    },
  }),
  mention: (username, mapping) => (
    mapping[username] ? `<@${mapping[username]}>` : `@${username}`
  ),
  addDivider: parts => [...parts, { type: "divider" }],
  flatten: parts => parts.flat(),
  withHeader: (header, body) => ([
    ..._.castArray(header),
    ..._.castArray(body),
  ]),
  composeBody: (main, secondary) => _.compact([main, secondary]),
  composeMsg: body => ({ blocks: _.castArray(body) }),
}

module.exports = { slack, slackText, markdown }
