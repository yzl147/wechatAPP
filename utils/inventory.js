const STORAGE_KEY = 'ingredient_inventory'

function getInventory() {
  const items = wx.getStorageSync(STORAGE_KEY)
  return Array.isArray(items) ? items : []
}

function saveInventory(items) {
  wx.setStorageSync(STORAGE_KEY, items)
}

function addInventory(item) {
  const items = getInventory()
  const inventoryItem = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: item.name.trim(),
    quantity: Number(item.quantity),
    unit: item.unit.trim() || '份',
    expiryDate: item.expiryDate || '',
    createdAt: Date.now()
  }
  items.unshift(inventoryItem)
  saveInventory(items)
  return inventoryItem
}

function updateQuantity(id, delta) {
  const items = getInventory().map(item => {
    if (item.id !== id) return item
    return { ...item, quantity: Math.max(0, Number(item.quantity) + delta) }
  })
  saveInventory(items)
  return items
}

function removeInventory(id) {
  const items = getInventory().filter(item => item.id !== id)
  saveInventory(items)
  return items
}

function getExpiryInfo(expiryDate) {
  if (!expiryDate) return { type: 'no-expiry', text: '未设置日期', order: 3 }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${expiryDate}T00:00:00`)
  const days = Math.round((expiry.getTime() - today.getTime()) / 86400000)
  if (days < 0) return { type: 'expired', text: '已过期', order: 0 }
  if (days === 0) return { type: 'expiring', text: '今天到期', order: 1 }
  if (days <= 3) return { type: 'expiring', text: `${days} 天后到期`, order: 1 }
  return { type: 'normal', text: `${days} 天后到期`, order: 2 }
}

function getDisplayInventory() {
  return getInventory().map(item => ({ ...item, expiry: getExpiryInfo(item.expiryDate) }))
    .sort((a, b) => a.expiry.order - b.expiry.order || a.createdAt - b.createdAt)
}

module.exports = { addInventory, updateQuantity, removeInventory, getDisplayInventory }
