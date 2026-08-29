const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const ROOT = path.resolve(__dirname, '..')
const SOURCE_DIRS = ['cloudfunctions', 'components', 'data', 'domain', 'pages', 'repositories', 'services', 'utils']
const failures = []

function walk(directory, predicate) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'miniprogram_npm') return []
      return walk(target, predicate)
    }
    return predicate(target) ? [target] : []
  })
}

function relative(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/')
}

function checkJavaScript() {
  const roots = [path.join(ROOT, 'app.js'), ...SOURCE_DIRS.map(dir => path.join(ROOT, dir))]
  const files = roots.flatMap(target => {
    if (!fs.existsSync(target)) return []
    if (fs.statSync(target).isFile()) return [target]
    return walk(target, file => file.endsWith('.js'))
  })
  files.forEach(file => {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
    if (result.status !== 0) failures.push(`JavaScript 语法错误：${relative(file)}\n${result.stderr.trim()}`)
  })
  return files.length
}

function checkJson() {
  const rootFiles = ['app.json', 'cloudbaserc.json', 'package.json', 'project.config.json', 'sitemap.json']
    .map(file => path.join(ROOT, file))
    .filter(fs.existsSync)
  const files = [
    ...rootFiles,
    ...['cloudfunctions', 'components', 'pages']
      .flatMap(directory => walk(path.join(ROOT, directory), file => file.endsWith('.json')))
  ]
  files.forEach(file => {
    try {
      JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
    } catch (error) {
      failures.push(`JSON 解析失败：${relative(file)}（${error.message}）`)
    }
  })
  return files.length
}

function checkPages() {
  const appConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'))
  const pages = Array.isArray(appConfig.pages) ? appConfig.pages : []
  const extensions = ['.js', '.json', '.wxml', '.wxss']

  pages.forEach(page => {
    extensions.forEach(extension => {
      if (!fs.existsSync(path.join(ROOT, `${page}${extension}`))) {
        failures.push(`注册页面缺少文件：${page}${extension}`)
      }
    })
  })

  const registered = new Set(pages)
  const pageWxmlFiles = walk(path.join(ROOT, 'pages'), file => file.endsWith('.wxml'))
  pageWxmlFiles.forEach(file => {
    const route = relative(file).replace(/\.wxml$/, '')
    if (!registered.has(route)) failures.push(`页面未在 app.json 注册：${route}`)
  })

  const tabPages = (((appConfig || {}).tabBar || {}).list || []).map(item => item.pagePath)
  tabPages.forEach(page => {
    if (!registered.has(page)) failures.push(`tabBar 页面未在 pages 中注册：${page}`)
  })

  return pages.length
}

function checkNavigationRoutes() {
  const appConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'))
  const registered = new Set(Array.isArray(appConfig.pages) ? appConfig.pages : [])
  const files = walk(path.join(ROOT, 'pages'), file => file.endsWith('.js'))
  const navigationPattern = /wx\.(?:navigateTo|redirectTo|switchTab|reLaunch)\s*\(\s*\{\s*url\s*:\s*([`'"])(\/pages\/[^`'"]+)\1/g
  let routeCount = 0

  files.forEach(file => {
    const source = fs.readFileSync(file, 'utf8')
    for (const match of source.matchAll(navigationPattern)) {
      routeCount += 1
      const route = match[2].split('?')[0].replace(/^\//, '')
      if (!registered.has(route)) failures.push(`导航目标未在 app.json 注册：${relative(file)} -> ${route}`)
    }
  })

  return routeCount
}

function checkStyles() {
  const styleFiles = ['pages', 'components']
    .flatMap(directory => walk(path.join(ROOT, directory), file => file.endsWith('.wxss')))
  let selectorCount = 0

  styleFiles.forEach(styleFile => {
    const base = styleFile.replace(/\.wxss$/, '')
    const sources = ['.wxml', '.js']
      .map(extension => `${base}${extension}`)
      .filter(fs.existsSync)
      .map(file => fs.readFileSync(file, 'utf8'))
      .join('\n')
    const style = fs.readFileSync(styleFile, 'utf8')
    const classes = new Set([...style.matchAll(/(?<![\w-])\.([A-Za-z_][\w-]*)/g)].map(match => match[1]))

    classes.forEach(className => {
      selectorCount += 1
      const modifierPrefix = className.includes('--') ? `${className.split('--')[0]}--` : ''
      const isUsed = sources.includes(className) || (modifierPrefix && sources.includes(modifierPrefix))
      if (!isUsed) failures.push(`样式选择器未被同名页面或组件使用：${relative(styleFile)} -> .${className}`)
    })
  })

  const appStyle = path.join(ROOT, 'app.wxss')
  const globalSources = ['pages', 'components']
    .flatMap(directory => walk(path.join(ROOT, directory), file => file.endsWith('.wxml') || file.endsWith('.js')))
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n')
  const globalClasses = new Set([
    ...fs.readFileSync(appStyle, 'utf8').matchAll(/(?<![\w-])\.([A-Za-z_][\w-]*)/g)
  ].map(match => match[1]))
  globalClasses.forEach(className => {
    selectorCount += 1
    if (!globalSources.includes(className)) failures.push(`全局样式选择器未被使用：app.wxss -> .${className}`)
  })

  return selectorCount
}

function checkWxmlHandlers() {
  const files = ['pages', 'components'].flatMap(directory => walk(path.join(ROOT, directory), file => file.endsWith('.wxml')))
  let handlerCount = 0
  files.forEach(wxmlFile => {
    const jsFile = wxmlFile.replace(/\.wxml$/, '.js')
    if (!fs.existsSync(jsFile)) return
    const wxml = fs.readFileSync(wxmlFile, 'utf8')
    const js = fs.readFileSync(jsFile, 'utf8')
    const eventPattern = /(?:bind|catch):?[a-zA-Z]+\s*=\s*"([^"]+)"/g
    const handlers = new Set()
    for (const match of wxml.matchAll(eventPattern)) {
      const value = match[1]
      if (value.includes('{{')) {
        for (const quoted of value.matchAll(/'([A-Za-z_$][\w$]*)'/g)) handlers.add(quoted[1])
      } else if (/^[A-Za-z_$][\w$]*$/.test(value)) {
        handlers.add(value)
      }
    }
    handlers.forEach(handler => {
      handlerCount += 1
      const escaped = handler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const declaration = new RegExp(`(?:async\\s+)?${escaped}\\s*\\(`)
      if (!declaration.test(js)) failures.push(`WXML 事件缺少页面方法：${relative(wxmlFile)} -> ${handler}`)
    })
  })
  return handlerCount
}

const counts = {
  javascript: checkJavaScript(),
  json: checkJson(),
  pages: checkPages(),
  routes: checkNavigationRoutes(),
  handlers: checkWxmlHandlers(),
  selectors: checkStyles()
}

if (failures.length > 0) {
  failures.forEach(message => console.error(`错误：${message}`))
  process.exitCode = 1
} else {
  console.log(`项目检查通过：${counts.javascript} 个 JS、${counts.json} 个 JSON、${counts.pages} 个注册页面、${counts.routes} 条导航、${counts.handlers} 个事件处理器、${counts.selectors} 个样式选择器`)
}
