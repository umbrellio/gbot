const url = require("../utils/url")
const network = require("../utils/network")

class GitLab {
  constructor({ gitlab }) {
    this.baseUrl = gitlab.url
    this.token = gitlab.token
    this.projects = gitlab.projects
  }

  approvals = (project, request) => {
    const uri = this.__getUrl("projects", project, "merge_requests", request, "approvals")
    return this.__get(uri)
  }

  project = id => this.__get(this.__getUrl("projects", id))

  requests = project => {
    const query = {
      sort: "asc",
      per_page: 100,
      state: "opened",
      scope: "all",
      wip: "no",
    }

    const uri = this.__getUrl("projects", project, "merge_requests")
    return this.__get(uri, query)
  }

  discussions = (project, request) => {
    const uri = this.__getUrl("projects", project, "merge_requests", request, "discussions")
    return this.__get(uri)
  }

  __getUrl = (...parts) => url.build(this.baseUrl, ...parts)

  __get = (url, query = {}) => network.get(url, query, { "Private-Token": this.token })
}

module.exports = GitLab
