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
  webhook: "<WEBHOOK URL>"             # Mattermost / Slack webhook
  channel: "<CHANNEL>"                 # Mattermost / Slack channel where will be messages sent
  markup: "slack"                      # Messenger markup (default - "markdown").
                                       # Possible values:
                                       # - "markdown" (for Mattermost)
                                       # - "slack" (for Slack)
  sender:
    username: "@umbrellio/gbot"        # Sender's display name
    icon: "<icon url>"                 # Sender's icon url
gitlab:
  token: "<TOKEN>"                     # GitLab Private Access Token
  url: "<gitlab api url>"              # Gitlab API base url
  projects:                            # List of your project ids
  - 42
  groups:                              # List of your project’s groups
    list:
    - 3
    excludeProjects:                   # List of projects to exclude from the groups projects
    - 11
    - 12

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
  diffs: false                         # Show changed lines count or not (default - false)
```

Example of calculating projects:

```yml
...
gitlab:
  ...
  projects:
  - 42
  - 43
  groups:
    list:
    - 3 # has projects with id 11, 12, 13, 14
    - 4 # has projects with id 21, 22
    excludeProjects:
    - 11
    - 12
    - 21
```

With the config above projects `13`, `14`, `22`, `42`, `43,` will be used in the bot.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/umbrellio/gbot.

## License

Released under MIT License.

## Authors

Created by [Aleksei Bespalov](https://github.com/nulldef).

<a href="https://github.com/umbrellio/">
<img style="float: left;" src="https://umbrellio.github.io/Umbrellio/supported_by_umbrellio.svg" alt="Supported by Umbrellio" width="439" height="72">
</a>
