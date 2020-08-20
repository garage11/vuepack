import {promises as fs} from 'fs'
import path from 'path'

import compiler from 'vue-template-compiler'
import transpile from 'vue-template-es2015-compiler'


export default class VuePack {

    constructor(options) {
        this.cache = {}

        this.options = {
            basePath: '/',
            excludeTokens: [],
        }

        this.results = {
            changed: {
                components: true,
                templates: true
            },
            components: null,
            templates: null,
        }

        Object.assign(this.options, options)
    }


    capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1)
    }


    async compile(vueFiles, updatedVueFile = null) {
        vueFiles.sort()
        let components = ''
        const componentNames = []
        const fileData = await Promise.all(vueFiles.map((filename) => fs.readFile(filename, 'utf8')))
        let templates = 'const _ = {};'


        for (const [i, vueFile] of vueFiles.entries()) {
            const componentName = this.toComponentName(vueFile)
            componentNames.push(componentName)
            components += `import ${componentName} from '${this.toBasePath(vueFile)}.js'\r\n`

            // Cache if the Vue-file was compiled earlier, unless an incremental
            // vue file build is triggered with `updatedVueFile`.
            if (this.cache[vueFile] && (!updatedVueFile || vueFile !== updatedVueFile)) {
                templates += this.cache[vueFile]
                continue
            }

            const compiled = compiler.compile(fileData[i], {preserveWhitespace: false})
            if (compiled.errors.length) throw compiled.errors.join(',')
            let jsTemplate = `_.${componentName}={r:${this.toFunction(compiled.render)}`
            if (compiled.staticRenderFns.length) {
                jsTemplate += `,s:[${compiled.staticRenderFns.map(this.toFunction).join(',')}]};`
            } else jsTemplate += '};'

            this.cache[vueFile] = jsTemplate
            templates += jsTemplate
        }

        components += `export default {${componentNames.join(', ')}}`
        templates += 'export default _'

        Object.assign(this.results, {
            changed: {
                components: (components !== this.results.components),
                templates: (templates !== this.results.templates),
            },
            components,
            templates
        })
        return this.results
    }


    toBasePath(filename) {
        return filename.replace(this.options.basePath, '').replace(path.extname(filename), '')
    }


    toComponentName(filename) {
        filename = this.toBasePath(filename)
        let tokens = []
        for (let token of filename.split('/')) {
            if (token !== '.' && !this.options.excludeTokens.includes(token)) {
                tokens.push(token)
            }
        }

        // Tokenize 'foo-bar' tokens and capitalize them.
        tokens = tokens.map((token) => token.split('-').map((p) => this.capitalize(p)).join(''))
        // Remove duplicate tokens.
        tokens = tokens.filter((v, i) => tokens.indexOf(v) === i)
        return tokens.join('')
    }


    toFunction(code) {
        return transpile(`function r(){${code}}`)
    }
}
