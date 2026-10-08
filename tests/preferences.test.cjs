const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { test } = require('node:test')
const ts = require('typescript')
const { computed } = require('vue')
const { createI18n } = require('vue-i18n')

function load(file, values = {}) {
  const saved = new Map(Object.entries(values))
  const exports = {}
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'vue') return { computed }
      if (name === 'vue-i18n') return { createI18n }
      return load(path.join(path.dirname(file), name + '.ts')).exports
    },
    localStorage: {
      getItem: key => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
      removeItem: key => saved.delete(key),
    },
    document: { documentElement: { removeAttribute() {} } },
  })
  return { exports, saved }
}

function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' ? keys(value, prefix + key + '.') : [prefix + key])
}

test('only English and Simplified Chinese load; old and invalid locales persist as English', () => {
  for (const old of [undefined, '', 'fa', 'vi', 'ru', 'zhHant', 'invalid', 'en', 'zhHans']) {
    const { exports: config, saved } = load('src/locales/index.ts', old === undefined ? {} : { locale: old })
    const expected = old === 'zhHans' ? 'zhHans' : 'en'
    assert.equal(config.i18n.global.locale.value, expected)
    assert.equal(saved.get('locale'), expected)
    assert.deepEqual(Array.from(config.i18n.global.availableLocales), ['en', 'zhHans'])
    assert.deepEqual(Array.from(config.languages, item => item.title), ['English', '简体中文'])
    config.i18n.global.locale.value = 'zhHans'
    assert.equal(config.locale.value, 'zh-CN')
  }
})

test('locale keys and interpolation parameters match, and literal UI keys exist', () => {
  const en = load('src/locales/en.ts').exports.default
  const zh = load('src/locales/zhcn.ts').exports.default
  const all = keys(en).sort()
  assert.deepEqual(all, keys(zh).sort())
  function leaf(obj, key) { return key.split('.').reduce((value, part) => value[part], obj) }
  for (const key of all) {
    const params = value => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
    assert.deepEqual(params(leaf(en, key)), params(leaf(zh, key)), key)
  }
  function check(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) { if (entry.name !== 'locales') check(file); continue }
      if (!/\.(ts|vue)$/.test(file)) continue
      for (const match of fs.readFileSync(file, 'utf8').matchAll(/(?:\$t|i18n\.global\.t)\(['"]([\w.]+)['"]\)/g)) {
        assert.ok(all.includes(match[1]), file + ': ' + match[1])
      }
    }
  }
  check('src')
})

test('theme migration preserves previous contrast and cleans legacy preferences', () => {
  for (const [values, expected] of [
    [{}, 'light'], [{ theme: 'light' }, 'light'], [{ theme: 'dark' }, 'dark'],
    [{ theme: 'system' }, 'light'], [{ theme: 'unknown' }, 'light'],
    ...['aurora', 'deepsea', 'cyber'].map(skin => [{ skin }, 'dark']),
    ...['mesh', 'sunrise', 'mint', 'unknown'].map(skin => [{ skin }, 'light']),
    [{ theme: 'light', skin: 'aurora' }, 'light'],
    [{ theme: 'dark', skin: 'mesh' }, 'dark'],
  ]) {
    const { exports: config, saved } = load('src/plugins/theme.ts', values)
    assert.equal(config.savedTheme(), expected)
    assert.equal(saved.get('theme'), expected)
    assert.equal(saved.has('skin'), false)
    assert.equal(config.savedTheme(), expected)
    assert.deepEqual(Array.from(config.themeModes), ['light', 'dark'])
  }
})

test('chart axes and legends use contrasting generated Vuetify colors in both modes', async () => {
  const { createVuetify } = await import('vuetify')
  const { chartTheme } = load('src/plugins/chartTheme.ts').exports
  const vuetify = createVuetify()
  for (const mode of ['light', 'dark']) {
    vuetify.theme.change(mode)
    const colors = vuetify.theme.global.current.value.colors
    const options = chartTheme({
      scales: { y: { min: 0, ticks: { count: 10 } } },
      plugins: { legend: { display: false } },
    }, colors)
    assert.equal(options.scales.x.ticks.color, colors['on-surface'])
    assert.equal(options.plugins.legend.labels.color, colors['on-surface'])
    assert.match(options.scales.y.grid.color, /^#[\da-f]{8}$/i)
    assert.equal(options.scales.y.min, 0)
    assert.equal(options.scales.y.ticks.count, 10)
    assert.equal(options.plugins.legend.display, false)
  }
})
