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


    toFunction(code) {
        return transpile(`function r(){${code}}`)
    }

    /**
     * Generates a template/component names based on the
     * path of the filename. A path filter can be used
     * to trim down on unwanted path elements.
     * @param {String} filename - Path to a template
     * @returns {String} - The generated template name
     */
    fileToTemplateName(filename) {
        let parts = []
        // Remove file extension.
        // let tmpName = filename.replace(path.extname(filename), '')
        for (let part of filename.replace(path.extname(filename), '').split('/')) {
            if (part !== '.' && !this.options.pathfilter.includes(part)) {
                part = part.split('-').map((p) => this.capitalize(p)).join('')
                parts.push(part)
            }
        }

        // Filter out double names.
        parts = parts.filter((value, index, self) => self.indexOf(value) === index)
        parts = parts.map((part) => this.capitalize(part))

        return parts.join('')
    }

    async compile(filenames) {
        let data = 'const _ = {};'
        const readFiles = await Promise.all(filenames.map((filename) => fs.readFile(filename, 'utf8')))
        filenames.forEach((filename, i) => {
            const templateData = readFiles[i]
            const templateName = this.fileToTemplateName(filename)

            let compiled = compiler.compile(templateData, {
                preserveWhitespace: false,
            })
            if (compiled.errors.length) throw compiled.errors.join(',')
            let jsTemplate = `_.${templateName}={r:${this.toFunction(compiled.render)}`
            if (compiled.staticRenderFns.length) {
                jsTemplate += `,s:[${compiled.staticRenderFns.map(this.toFunction).join(',')}]};`
            } else jsTemplate += '};'

            data += jsTemplate
        })

        data += 'export default _'
        return data
    }
}
