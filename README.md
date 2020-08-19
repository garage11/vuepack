# Vuepack

Vuepack is a non-SFC Vue compiler for Vue 2 that plays nice with ESM imports
and Snowpack. It generates templates and component imports from a glob of
Vue components, making it simple to include Vue in any JavaScript build
process. It expects the following directory conventions for components; e.g.:

```bash
/project/src/components/my-component/my-component.js
/project/src/components/my-component/my-component.vue
```

## Usage

Checkout the CA11 project [CLI](https://github.com/open-voip-alliance/ca11/blob/master/cli.js)
on how you can integrate Vuepack in a custom CLI. To get started:

```bash
yarn add globby @garage11/vuepack --dev
```

```javascript
import {promises as fs} from 'fs'
import globby from 'globby'
import VuePack from '@garage11/vuepack'

...
let vuePack

const vueFiles = await globby(['./src/components/**/*.vue'])
const vueFileUpdated = './src/components/some-component/some-component.vue'

// Keep the vuePack instance for incremental builds.
if (!vuePack) {
    vuePack = new VuePack({
        basePath: '/home/to/this/project/',
        excludeTokens: ['src', 'components'],
    })
}

const {components, templates} = await vuePack.compile(vueFiles, vueFileUpdated)
await Promise.all([
    fs.writeFile(path.join('build', 'components.js'), components),
    fs.writeFile(path.join('build', 'templates.js'), templates),
    fs.writeFile(path.join('src', 'components.js'), templates),
    fs.writeFile(path.join('src', 'templates.js'), templates),
])
```
