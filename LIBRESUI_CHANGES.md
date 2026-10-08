# LibreSUI simplification report

Frontend source remains a Git submodule. Its changes are published on the `codex/libresui-frontend` branch of `ThatYT/libresui`, preserving the existing frontend history. The main branch points to that frontend commit and uses the same repository URL in `.gitmodules`. No backend source, API, database schema, deployment script, or Dockerfile was changed.

## Changes

- Retained `src/locales/en.ts` and `src/locales/zhcn.ts`; runtime language IDs are only `en` and `zhHans`. Both selectors display only English and 简体中文. Invalid/removed saved locales are persisted as English. English is the default.
- Removed unused Persian, Russian, Vietnamese, Traditional Chinese catalogs and Vuetify/Moment locale imports. Scanned all frontend source for Chinese/Persian/Russian/Vietnamese text outside locale files; remaining Chinese text consists only of comments in Settings.vue.
- Localized explanatory protocol fields, routing choices, subscription presets, QR dialogs, validation/notification labels (including known backend authentication/validation errors without changing responses), and calendar controls. Kept protocol/configuration identifiers and diagnostic payloads intact. Both catalogs have matching leaf keys and interpolation parameters, checked by regression tests.
- Replaced six gradient skins with one shared Light/Dark selector used on login and in the app bar. Preferences use localStorage `theme`. Known dark legacy presets (aurora, deepsea, cyber) migrate to Dark; mesh, sunrise, mint and unrecognized settings fall back to Light. Existing explicit light/dark choices take precedence. Removed obsolete skin CSS, configuration, menu entries, and translation keys.
- Preserved Vuetify layouts/components and responsive behavior. Updated chart axes/grid/legend colors and editor CSS to follow the selected mode, improved Dark primary contrast and login link colors, and replaced the unused Persian font with a system font stack supporting the retained languages.
- Migrated the broken legacy ESLint setup to flat configuration compatible with the already locked ESLint 10. Added its explicit dependency and a TypeScript parser; lint no longer applies automatic fixes. Added four regression checks.

## Validation

Commands executed with bundled Node and a temporary official Go 1.26.5 toolchain:

```sh
# frontend/
npm ci --cache /private/tmp/libresui-npm-cache --no-audit --no-fund
npm install --cache /private/tmp/libresui-npm-cache --no-audit --no-fund
node node_modules/vue-tsc/bin/vue-tsc.js --noEmit
npm run build
npm test
npm run lint
# final lint output and baseline comparison
node node_modules/eslint/bin/eslint.js . --format json --output-file /private/tmp/libresui-lint-final.json
# unchanged HEAD was extracted to /private/tmp/libresui-lint-baseline,
# then linted with the same flat config and installed dependencies.

# main repository: consume the generated frontend through the existing embed path
mkdir -p web/html
cp -R frontend/dist/. web/html/
GOCACHE=/private/tmp/libresui-go-cache GOMODCACHE=/private/tmp/libresui-go-mod \
  /private/tmp/libresui-toolchain/go/bin/go build -o /private/tmp/libresui-backend main.go
```

The npm CLI was obtained with `pnpm dlx npm` and subsequently invoked directly with bundled Node. No manual edits were made to dist or web/html; the generated files were copied as the existing build expects. TypeScript, production build, four regression tests, and backend compilation passed. The Go binary was also run against a disposable temporary database on localhost ports 4180/4181; default local sign-in, frontend asset serving, dashboard updates, navigation, tables, node/user dialogs, and date picker were smoke-tested. Language and theme menus and persistence were checked on login and in the panel. Charts and dialogs were inspected in Light and Dark; the mobile dashboard was inspected at 390×844. Browser logs showed no warnings/errors during these checks.

## Remaining warnings and limitations

- Lint reports 260 pre-existing errors. Comparing file/rule/message occurrence counts against unchanged frontend HEAD with the identical config found zero introduced errors. Most concern prop mutation, missing loop keys, and existing Vuetify slot/component patterns. These were not refactored as part of this UI task.
- npm reported deprecated existing transitive packages (inflight, rimraf, glob). npm 12 blocked optional install hooks for @parcel/watcher, fsevents, and the core-js informational postinstall; the production build still passed.
- Docker is unavailable, so a Docker image build was not executed. Dockerfiles and build scripts are unchanged; the same frontend build and backend embedding path were verified locally. The Go check used the default build configuration, not every deployment-specific build-tag/platform combination.
- Smoke checks used a fresh local database and did not exercise live remote nodes or every protocol/subscription backend behavior. Backend functionality and API contracts were preserved by leaving backend code unchanged.

## Exact changed files

Main repository:

- `.gitmodules` — frontend repository URL and branch.
- `README.md` — supported language/theme documentation and clone instructions.
- `LIBRESUI_CHANGES.md` — this report.
- `frontend` — published frontend commit reference.

Frontend submodule (paths relative to `frontend/`; M = modified, D = deleted, A = added):

- D `.eslintrc.js`
- M `README.md`
- M `package-lock.json`
- M `package.json`
- D `src/assets/Vazirmatn-UI-NL-Regular.woff2`
- M `src/components/DateTime.vue`
- M `src/components/Dial.vue`
- M `src/components/Editor.vue`
- M `src/components/Listen.vue`
- M `src/components/OutJson.vue`
- M `src/components/SubClashExt.vue`
- M `src/components/SubJsonExt.vue`
- M `src/components/UoT.vue`
- M `src/components/WgPeer.vue`
- M `src/components/protocols/AnyTls.vue`
- M `src/components/protocols/Hysteria.vue`
- M `src/components/protocols/Hysteria2.vue`
- M `src/components/protocols/ShadowTls.vue`
- M `src/components/protocols/Ssh.vue`
- M `src/components/protocols/Tuic.vue`
- M `src/components/protocols/Tun.vue`
- M `src/components/protocols/Vmess.vue`
- M `src/components/protocols/Warp.vue`
- M `src/components/protocols/Wireguard.vue`
- M `src/components/services/Derp.vue`
- M `src/components/tiles/History.vue`
- M `src/components/tls/Acme.vue`
- M `src/components/tls/Ech.vue`
- M `src/components/tls/OutTLS.vue`
- M `src/components/transports/WebSocket.vue`
- M `src/layouts/default/AppBar.vue`
- M `src/layouts/modals/Changes.vue`
- M `src/layouts/modals/Client.vue`
- M `src/layouts/modals/Dns.vue`
- M `src/layouts/modals/DnsRule.vue`
- M `src/layouts/modals/Endpoint.vue`
- M `src/layouts/modals/QrCode.vue`
- M `src/layouts/modals/Rule.vue`
- M `src/layouts/modals/Stats.vue`
- M `src/layouts/modals/Tls.vue`
- M `src/layouts/modals/Token.vue`
- M `src/layouts/modals/WgQrCode.vue`
- M `src/locales/en.ts`
- D `src/locales/fa.ts`
- M `src/locales/index.ts`
- D `src/locales/ru.ts`
- D `src/locales/vi.ts`
- M `src/locales/zhcn.ts`
- D `src/locales/zhtw.ts`
- M `src/main.ts`
- M `src/plugins/httputil.ts`
- D `src/plugins/skins.ts`
- M `src/plugins/vuetify.ts`
- M `src/styles/settings.scss`
- D `src/styles/skins.css`
- M `src/views/Admins.vue`
- M `src/views/Basics.vue`
- M `src/views/Login.vue`
- M `src/vite-env.d.ts`
- A `eslint.config.mjs`
- A `src/components/ThemeMenu.vue`
- A `src/plugins/chartTheme.ts`
- A `src/plugins/theme.ts`
- A `tests/preferences.test.cjs`
