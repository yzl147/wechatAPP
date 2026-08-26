const FORBIDDEN_CLIENT_ACTIONS = new Set(['reinit'])

function getForbiddenActionResponse(action) {
  if (!FORBIDDEN_CLIENT_ACTIONS.has(action)) return null
  return {
    code: 40301,
    message: '无权执行菜谱管理操作'
  }
}

function maskIdentifier(identifier) {
  if (!identifier) return 'unknown'
  if (identifier.length <= 6) return '***'
  return `${identifier.slice(0, 3)}***${identifier.slice(-3)}`
}

module.exports = { getForbiddenActionResponse, maskIdentifier }
