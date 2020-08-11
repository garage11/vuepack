import {promises as fs} from 'fs'
import path from 'path'

import compiler from 'vue-template-compiler'
import transpile from 'vue-template-es2015-compiler'


export default class VuePack {

    constructor(options) {
        this.options = options
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
            const templateData = readFiles[i]
            const componentName = this.fileToComponentName(filename, this.options.pathFilter)
            const importPath = this.fileToImportPath(filename, this.options.importFilter)
            componentNames.push(componentName)

            components += `import ${componentName} from '${importPath}'\r\n`

            let compiled = compiler.compile(templateData, {
                preserveWhitespace: false,
            })
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


    /**
     * Generate a component name based on the path of the filename.
     * A path filter is used to trim down unwanted path parts.
     * @param {String} filename - Path to a template
     * @returns {String} - The generated template name
     */
    fileToComponentName(filename) {
        let parts = this.filter(filename, this.options.pathFilter, true)
        // Filter out double names.
        parts = parts.filter((value, index, self) => self.indexOf(value) === index)
        parts = parts.map((part) => this.capitalize(part))
        return parts.join('')
    }


    fileToImportPath(filename) {
        let parts = this.filter(filename, this.options.importFilter)
        return `/${path.join(parts.join('/'))}.js`
    }


    filter(filename, filter, toPascalCase = false) {
        let parts = []
        for (let part of filename.replace(path.extname(filename), '').split('/')) {
            if (part !== '.' && !filter.includes(part)) {
                if (toPascalCase) {
                    part = part.split('-').map((p) => this.capitalize(p)).join('')
                }
                parts.push(part)
            }
        }

        return parts
    }


    toFunction(code) {
        return transpile(`function r(){${code}}`)
    }
}
