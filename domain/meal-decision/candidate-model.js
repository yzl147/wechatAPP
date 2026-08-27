const CUSTOM_SOURCE_TYPES = ['dine_in', 'takeout']

const DEFAULT_DEFINITIONS = [
  ['default-dine-in-canteen', 'dine_in', '公司/学校食堂'],
  ['default-dine-in-noodles', 'dine_in', '面食'],
  ['default-dine-in-fast-meal', 'dine_in', '快餐简餐'],
  ['default-dine-in-hot-pot', 'dine_in', '火锅'],
  ['default-dine-in-barbecue', 'dine_in', '烧烤'],
  ['default-dine-in-japanese', 'dine_in', '日料'],
  ['default-takeout-rice', 'takeout', '米饭套餐'],
  ['default-takeout-noodles', 'takeout', '面食'],
  ['default-takeout-malatang', 'takeout', '麻辣烫'],
  ['default-takeout-light-meal', 'takeout', '轻食'],
  ['default-takeout-burger', 'takeout', '汉堡炸鸡'],
  ['default-takeout-porridge', 'takeout', '粥和小吃']
]

function createDefaultCandidates() {
  return DEFAULT_DEFINITIONS.map(([id, sourceType, name]) => ({
    id,
    sourceType,
    name,
    note: '',
    dishId: null,
    enabled: true,
    weight: 1,
    createdAt: 0,
    updatedAt: 0
  }))
}

function createCandidate(input, { id, now }) {
  const candidate = {
    id,
    sourceType: input.sourceType,
    name: normalizeText(input.name),
    note: normalizeText(input.note),
    dishId: null,
    enabled: input.enabled !== false,
    weight: 1,
    createdAt: now,
    updatedAt: now
  }
  assertCandidate(candidate)
  return candidate
}

function updateCandidate(candidate, changes, now) {
  const next = {
    ...candidate,
    name: changes.name === undefined ? candidate.name : normalizeText(changes.name),
    note: changes.note === undefined ? candidate.note : normalizeText(changes.note),
    enabled: changes.enabled === undefined ? candidate.enabled : changes.enabled,
    updatedAt: now
  }
  assertCandidate(next)
  return next
}

function getEnabledCandidates(candidates, sourceType) {
  return candidates.filter(candidate => candidate.sourceType === sourceType && candidate.enabled)
}

function isCandidate(candidate) {
  return candidate && typeof candidate === 'object' &&
    typeof candidate.id === 'string' && candidate.id.length > 0 && candidate.id.length <= 80 &&
    CUSTOM_SOURCE_TYPES.includes(candidate.sourceType) &&
    typeof candidate.name === 'string' && candidate.name.trim().length > 0 && candidate.name.length <= 40 &&
    typeof candidate.note === 'string' && candidate.note.length <= 80 && candidate.dishId === null &&
    typeof candidate.enabled === 'boolean' && candidate.weight === 1 &&
    Number.isSafeInteger(candidate.createdAt) && candidate.createdAt >= 0 &&
    Number.isSafeInteger(candidate.updatedAt) && candidate.updatedAt >= 0
}

function assertCandidate(candidate) {
  if (!isCandidate(candidate)) throw new Error('候选餐单内容不正确')
}

function normalizeText(value) {
  return String(value || '').trim()
}

module.exports = {
  CUSTOM_SOURCE_TYPES,
  createDefaultCandidates,
  createCandidate,
  updateCandidate,
  getEnabledCandidates,
  isCandidate
}
