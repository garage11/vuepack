# vuepack

Vuepack is a simple component compiler for Vue 2 that plays nice
with ESM imports and Snowpack. It generates templates and component
imports from a glob of Vue components, making it simple to include Vue
in any JavaScript build process. Vuepack is meant as an alternative to
Single File Components. It expects the following directory conventions
for components; e.g.:

```bash
/project/src/components/my-component/my-component.js
/project/src/components/my-component/my-component.vue
```

## Usage

Checkout [vuepack-demo](https://github.com/open-voip-alliance/ca11/blob/master/cli.js)
for an example JavaScript project build that uses Vuepack. Basically,
this is all there is to it:

```bash
yarn add globby @garage11/vuepack --dev
```

```javascript
import {promises as fs} from 'fs'
import globby from 'globby'
import VuePack from '@garage11/vuepack'

const vuePack = new VuePack({
    basePath: '/home/to/this/project/',
    excludeTokens: ['src', 'components'],
})

const targets = await globby(['./src/components/**/*.vue'])
const result = await vuePack.compile(targets)
await Promise.all([
    fs.writeFile(path.join('build', 'components.js'), components),
    fs.writeFile(path.join('build', 'templates.js'), templates),
    fs.writeFile(path.join('src', 'components.js'), templates),
    fs.writeFile(path.join('src', 'templates.js'), templates),
])
```
