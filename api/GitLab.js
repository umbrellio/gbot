const _ = require("lodash")
const url = require("../utils/url")
const network = require("../utils/network")

class GitLab {
  constructor ({ gitlab }) {
    this.baseUrl = gitlab.url
    this.token = gitlab.token
  }

  approvals = (project, request) => {
    const uri = this.__getUrl("projects", project, "merge_requests", request, "approvals")
    return this.__get(uri)
  }

  changes = (project, request) => {
    const uri = this.__getUrl("projects", project, "merge_requests", request, "changes")
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
    return this.__getPaginated(uri, query)
  }

  groupProjects = group => {
    const uri = this.__getUrl("groups", group, "projects")
    return this.__getPaginated(uri)
      .then(projects => projects.map(project => project.id))
  }

  discussions = (project, request) => {
    const query = { page: 1, per_page: 100 }
    const uri = this.__getUrl("projects", project, "merge_requests", request, "discussions")

    return this.__getPaginated(uri, query)
  }

  __getUrl = (...parts) => url.build(this.baseUrl, ...parts)

  __get = (url, query = {}) => network.get(url, query, { "Private-Token": this.token })

  __getPaginated = (uri, query = {}) => {
    return this.__get(uri, query).then(async results => {
      const { headers } = results
      const totalPages = parseInt(headers["x-total-pages"], 10) || 1

      let page = 1
      let allResults = results

      while (totalPages > page) {
        page += 1

        const nextPageResults = await this.__get(uri, { ...query, page })
        allResults = allResults.concat(nextPageResults)
      }

      return Promise.resolve(allResults)
    })
  }
}

module.exports = GitLab
