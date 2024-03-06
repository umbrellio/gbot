# @umbrellio/gbot

Gitlab bot platform.

## Installation

```sh
$ yarn add @umbrellio/gbot
```

or

```sh
$ npm i @umbrellio/gbot
```

## Usage

### `unapproved`

Sends unapproved MRs to mattermost / slack. MR will be ignored if it has `Draft`/`WIP` mark.

```sh
$ gbot unapproved -c /path/to/config/gbot.yaml
```

## Configuration

Each setting can be set via environment variables.
Each variable must start with `GBOT_` prefix. Double underscore is interpreted as nesting, for example:

```sh
GBOT_GITLAB_TOKEN=token # { "gitlabToken": "token" }
GBOT_GITLAB__TOKEN=token # {"gitlab": { "token": "token" } }
```

Example of the config file:

```yml
messenger:
  url: "<chat.postMessage URL>"        # Slack chat.postMessage endpoint
  token: "<TOKEN>"                     # Slack token with chat:write scope
  channel: "<CHANNEL>"                 # Mattermost / Slack channel where will be messages sent
  markup: "slack"                      # Messenger markup (default - "markdown").
                                       # Possible values:
                                       # - "markdown" (for Mattermost)
                                       # - "slack" (for Slack)
  sender:
    username: "@umbrellio/gbot"        # Sender's display name
    icon: "<icon url>"                 # Sender's icon url
  slack:
    usernameMapping:
      pavel: "U020DSB741G"             # Mapping of Gitlab username to Slack ID
gitlab:
  token: "<TOKEN>"                     # GitLab Private Access Token
  url: "<gitlab api url>"              # Gitlab API base url
  groups:                              # List of your project’s groups (optional if projects are defined)
  - id: 4                              # Group id
    excluded: [1, 2, 3]                # List of projects to exclude from the current group projects (optional)
  - id: 5
  projects:                            # List of your project (optional if groups are defined)
  - id: 42                             # Project id
    paths:                             # List of paths that should be changed in merge requests
    - src/**/*
  - id: 43

# tasks config
unapproved:                            # Config for `unapproved` command
  emoji:                               # Emoji which will be set for each MR (optional)
    24h: ":emoji1:"                    # If MR's last update time more than 24 hours
                                       # Time interval can be set in seconds, minutes,
                                       # hours and days (30s, 10m, 5h, 2d)
    12h: ":emoji2:"                    # If MR's last update time more than 12 hours
    default: ":emoji3:"                # Default emoji (if other ones wasn't matched)
  tag:                                 # Specify who will be tagged in messenger
    approvers: false                   # Tag approvers or not (default - false)
    author: false                      # Tag author of PR or not (default - false)
    commenters: false                  # Tag thread commenters or not (default - false)
    onThreadsOpen: false               # Whether to tag thread authors and PR author when threads are present
  diffs: false                         # Show changed lines count or not (default - false)
  splitByReviewProgress: false         # Whether to split the requests into those completely without review and those that under review
  requestsPerMessage: 15               # Merge requests count per message
```

Groups in the config are [Gitlab project groups](https://docs.gitlab.com/ee/user/group/). You must specify the group or the project, or both.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/umbrellio/gbot.

## License

Released under MIT License.

## Authors

Created by [Aleksei Bespalov](https://github.com/nulldef).

<a href="https://github.com/umbrellio/">
<img style="float: left;" src="https://umbrellio.github.io/Umbrellio/supported_by_umbrellio.svg" alt="Supported by Umbrellio" width="439" height="72">
</a>
