const crypto = require('crypto')
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const { runCloudRequest } = require('./runtime')
const { mergeData, defaultData, validateEvent } = require('./domain')

const COLLECTION = 'userData'

function getDocumentId(openid, kind) {
  return crypto.createHash('sha256').update(`${openid}:${kind}`).digest('hex').slice(0, 32)
}

async function getDocument(collection, documentId) {
  const { data } = await collection.where({ _id: documentId }).limit(1).get()
  return data[0] || null
}

function toResponse(document, kind) {
  return {
    data: document ? document.data : defaultData(kind),
    revision: document ? document.revision : 0
  }
}

async function handleRequest(event, OPENID) {
  const validationError = validateEvent(event)
  if (validationError) return validationError
  const { action, kind } = event
  const documentId = getDocumentId(OPENID, kind)

  if (action === 'get') {
    const document = await getDocument(db.collection(COLLECTION), documentId)
    return { code: 0, data: toResponse(document, kind) }
  }

  return db.runTransaction(async transaction => {
    const collection = transaction.collection(COLLECTION)
    const current = await getDocument(collection, documentId)

    if (action === 'migrate') {
      const migrationIds = current && Array.isArray(current.migrationIds) ? current.migrationIds : []
      if (migrationIds.includes(event.migrationId)) return { code: 0, data: toResponse(current, kind) }
      const next = {
        _openid: OPENID,
        kind,
        schemaVersion: 1,
        revision: (current ? current.revision : 0) + 1,
        data: mergeData(kind, current ? current.data : defaultData(kind), event.data),
        migrationIds: migrationIds.concat(event.migrationId).slice(-20),
        updatedAt: Date.now()
      }
      await collection.doc(documentId).set({ data: next })
      return { code: 0, data: toResponse(next, kind) }
    }

    const revision = current ? current.revision : 0
    if (revision !== event.expectedRevision) {
      return { code: 40901, message: '数据已在其他设备更新', data: toResponse(current, kind) }
    }
    const next = {
      _openid: OPENID,
      kind,
      schemaVersion: 1,
      revision: revision + 1,
      data: event.data,
      migrationIds: current && current.migrationIds || [],
      updatedAt: Date.now()
    }
    await collection.doc(documentId).set({ data: next })
    return { code: 0, data: toResponse(next, kind) }
  })
}

exports.main = (event, context) => runCloudRequest({
  functionName: 'manageUserData',
  event,
  getCaller: () => cloud.getWXContext().OPENID,
  handler: OPENID => handleRequest(event, OPENID)
})

module.exports.getDocumentId = getDocumentId
