import {promises as fs} from 'fs'
import path from 'path'

import compiler from 'vue-template-compiler'
import transpile from 'vue-template-es2015-compiler'


export default class VuePack {

    constructor(options) {
        this.options = {
            basePath: '/',
            excludeTokens: [],
        }
        Object.assign(this.options, options)
    }


    capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1)
    }


    async compile(filenames) {
        let templates = 'const _ = {};'
        const readFiles = await Promise.all(filenames.map((filename) => fs.readFile(filename, 'utf8')))
        let components = ''
        const componentNames = []

        filenames.forEach((filename, i) => {
            const componentName = this.toComponentName(filename)
            componentNames.push(componentName)
            components += `import ${componentName} from '${this.toBasePath(filename)}.js'\r\n`
            const compiled = compiler.compile(readFiles[i], {preserveWhitespace: false})

            if (compiled.errors.length) throw compiled.errors.join(',')
            let jsTemplate = `_.${componentName}={r:${this.toFunction(compiled.render)}`
            if (compiled.staticRenderFns.length) {
                jsTemplate += `,s:[${compiled.staticRenderFns.map(this.toFunction).join(',')}]};`
            } else jsTemplate += '};'

            templates += jsTemplate
        })

        components += `export default {${componentNames.join(', ')}}`
        templates += 'export default _'
        return {components, templates}
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
