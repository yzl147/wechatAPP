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

module.exports = { createDefaultCandidates }
