const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const ROOT = path.resolve(__dirname, '..')
const CORE_ENTRY_FILES = [
  'pages/home/home.wxml',
  'pages/meal-record/meal-record.wxml',
  'pages/order-detail/order-detail.wxml',
  'pages/life-completion-detail/life-completion-detail.wxml'
]

test('核心功能入口不再使用系统 Emoji 作为图标', () => {
  const filesWithEmoji = CORE_ENTRY_FILES.filter(file => {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8')
    return /\p{Extended_Pictographic}/u.test(source)
  })

  assert.deepEqual(filesWithEmoji, [])
})
