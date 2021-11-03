const _ = require("lodash")

const markdown = {
  makeLink: (title, url) => `[${title}](${url})`,
  makeText: text => text,
  makePrimaryInfo: info => info,
  makeAdditionalInfo: parts => parts.join("\n"),
  makeBold: content => `**${content}**`,
  makeHeader: text => `#### ${text}`,
  addDivider: parts => `${parts} \n`,
  flatten: parts => parts.join("\n"),
  composeBody: (main, secondary) => _.compact([main, secondary]).join("\n"),
  composeMsg: (header, body) => ({
    text: `${header}\n\n${body}`,
  }),
}

const slack = {
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
  addDivider: parts => [...parts, { type: "divider" }],
  flatten: parts => parts.flat(),
  composeBody: (main, secondary) => _.compact([main, secondary]),
  composeMsg: (header, body) => ({
    blocks: [
      ..._.castArray(header),
      ..._.castArray(body),
    ],
  }),
}

module.exports = { slack, markdown }
