const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const ROOT = path.resolve(__dirname, '..')
const RUNTIME_PATHS = [
  'app.js',
  'cloudfunctions',
  'components',
  'domain',
  'pages',
  'repositories',
  'services',
  'utils'
]

function listJavaScriptFiles(target) {
  if (!fs.existsSync(target)) return []
  const stat = fs.statSync(target)
  if (stat.isFile()) return target.endsWith('.js') ? [target] : []
  return fs.readdirSync(target, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === 'node_modules' || entry.name === 'miniprogram_npm') return []
    return listJavaScriptFiles(path.join(target, entry.name))
  })
}

test('运行时代码不调用剪贴板隐私接口', () => {
  const calls = RUNTIME_PATHS
    .flatMap(target => listJavaScriptFiles(path.join(ROOT, target)))
    .filter(file => /wx\.(?:get|set)ClipboardData\s*\(/.test(fs.readFileSync(file, 'utf8')))
    .map(file => path.relative(ROOT, file).replaceAll('\\', '/'))

  assert.deepEqual(calls, [])
})
