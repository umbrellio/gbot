const _ = require("lodash")

const markdown = {
  makeLink: (title, url) => `[${title}](${url})`,
  makeText: text => text,
  makeBold: content => `**${content}**`,
  makeHeader: text => `#### ${text}`,
  addDivider: parts => `${parts} \n`,
  addLineBreaks: parts => parts.join("\n"),
  flatten: parts => parts.join("\n"),
  composeMsg: (header, body) => ({
    text: `${header}\n\n${body}`,
  }),
}

const slack = {
  makeLink: (title, url) => `<${url}|${title}>`,
  makeText: (text, { withMentions = true } = {}) => ({
    type: "section",
    text: {
      type: "mrkdwn",
      text,
      verbatim: !withMentions,
    },
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
  addLineBreaks: parts => parts, // cause Slack breaks lines automatically
  flatten: parts => parts.flat(),
  composeMsg: (header, body) => ({
    blocks: [
      ..._.castArray(header),
      ..._.castArray(body),
    ],
  }),
}

module.exports = { slack, markdown }
