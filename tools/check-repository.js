const { execFileSync } = require('node:child_process')

const forbiddenFiles = new Set([
  '.env',
  '.env.local',
  '.mcp.json',
  'project.private.config.json',
  'CODEBUDDY.md'
])
const forbiddenPrefixes = [
  '.cloudbase/',
  '.codebuddy/',
  '.rules/',
  'rules/',
  'codebuddy-plugin/'
]

function isForbidden(file) {
  const normalized = file.replaceAll('\\', '/')
  const isPrivateEnv = normalized.startsWith('.env.') && normalized !== '.env.example'
  return forbiddenFiles.has(normalized) ||
    isPrivateEnv ||
    forbiddenPrefixes.some(prefix => normalized.startsWith(prefix))
}

let trackedFiles
try {
  trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
} catch (error) {
  console.error('无法读取 Git 跟踪文件，请确认当前目录是 Git 仓库')
  process.exit(1)
}

const forbiddenTrackedFiles = trackedFiles.filter(isForbidden)
if (forbiddenTrackedFiles.length > 0) {
  console.error('以下本机配置或工具生成文件不应被 Git 跟踪：')
  forbiddenTrackedFiles.forEach(file => console.error(`- ${file}`))
  process.exit(1)
}

console.log(`仓库卫生检查通过：${trackedFiles.length} 个跟踪文件`)
