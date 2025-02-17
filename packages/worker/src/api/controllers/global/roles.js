const { getAllRoles } = require("@budibase/backend-core/roles")
const {
  getAllApps,
  getProdAppID,
  DocumentTypes,
} = require("@budibase/backend-core/db")
const { doInAppContext, getAppDB } = require("@budibase/backend-core/context")

exports.fetch = async ctx => {
  const tenantId = ctx.user.tenantId
  // always use the dev apps as they'll be most up to date (true)
  const apps = await getAllApps({ tenantId, all: true })
  const promises = []
  for (let app of apps) {
    // use dev app IDs
    promises.push(getAllRoles(app.appId))
  }
  const roles = await Promise.all(promises)
  const response = {}
  for (let app of apps) {
    const deployedAppId = getProdAppID(app.appId)
    response[deployedAppId] = {
      roles: roles.shift(),
      name: app.name,
      version: app.version,
      url: app.url,
    }
  }
  ctx.body = response
}

exports.find = async ctx => {
  const appId = ctx.params.appId
  await doInAppContext(appId, async () => {
    const db = getAppDB()
    const app = await db.get(DocumentTypes.APP_METADATA)
    ctx.body = {
      roles: await getAllRoles(),
      name: app.name,
      version: app.version,
      url: app.url,
    }
  })
}
