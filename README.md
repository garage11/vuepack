# vuepack

Vuepack is a simple wrapper around the Vue 2 template compiler.

It generates an ECMAScript module from a glob of Vue templates,
making it simple to include Vue in any JavaScript build process.
No need for slow and complex tooling.

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
