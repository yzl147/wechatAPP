const DAY_MS = 86400000

function getExpiryInfo(expiryDate, currentDate = new Date()) {
  if (!expiryDate) return { type: 'no-expiry', text: '未设置日期', order: 3 }
  const today = new Date(currentDate)
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${expiryDate}T00:00:00`)
  const days = Math.round((expiry.getTime() - today.getTime()) / DAY_MS)
  if (days < 0) return { type: 'expired', text: '已过期', order: 0 }
  if (days === 0) return { type: 'expiring', text: '今天到期', order: 1 }
  if (days <= 3) return { type: 'expiring', text: `${days} 天后到期`, order: 1 }
  return { type: 'normal', text: `${days} 天后到期`, order: 2 }
}

function createDisplayInventory(items, currentDate = new Date()) {
  return items.map(item => ({ ...item, expiry: getExpiryInfo(item.expiryDate, currentDate) }))
    .sort((a, b) => a.expiry.order - b.expiry.order || a.createdAt - b.createdAt)
}

module.exports = { getExpiryInfo, createDisplayInventory }
