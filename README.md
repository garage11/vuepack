# vuepack

Vuepack is a simple component compiler for Vue 2 that plays nice
with ESM imports and Snowpack. It generates templates and component
imports from a glob of Vue components, making it simple to include Vue
in any JavaScript build process. Vuepack is meant as an alternative to
Single File Components.

## Usage

Checkout [vuepack-demo](https://github.com/garage11/vuepack-demo) for an
example JavaScript project build that uses Vuepack. Basically,
this is all there is to it:

```bash
yarn add globby @garage11/vuepack
```

```javascript
import {promises as fs} from 'fs'
import globby from 'globby'
import VuePack from '@garage11/vuepack'

const vuePack = new VuePack({
    pathfilter: ['src', 'components'],
    vue: {
        preserveWhitespace: false,
    }
})

const targets = await globby(['./src/components/**/*.vue'])
const result = await vuePack.compile(targets)
await fs.writeFile('./src/js/templates.js', result)
```
