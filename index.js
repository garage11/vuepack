import {promises as fs} from 'fs'
import path from 'path'

import compiler from 'vue-template-compiler'
import transpile from 'vue-template-es2015-compiler'


export default class VuePack {

    constructor(options) {
        this.options = options
    }

    toFunction(code) {
        return transpile(`function r(){${code}}`)
    }

    /**
     * Generates template names based on its path
     * and filename. Use path filtering to filter
     * out unwanted directory parts.
     * @param {String} filename - Path to a template
     * @returns {String} - The generated template name
     */
    fileToTemplateName(filename) {
        let templateNameParts = []
        let tmpName = filename.replace(path.extname(filename), '').replace(/-/g, '_')
        for (let part of tmpName.split('/')) {
            if (part !== '.' && !this.options.pathfilter.includes(part)) {
                templateNameParts.push(part)
            }
        }
        // Filter out double names.
        templateNameParts = templateNameParts.filter((value, index, self) => self.indexOf(value) === index)
        let templateName = templateNameParts.join('_')
        return templateName
    }

    async compile(filenames) {
        let data = 'const _ = {};'
        const readFiles = await Promise.all(filenames.map((filename) => fs.readFile(filename, 'utf8')))
        filenames.forEach((filename, i) => {
            const templateData = readFiles[i]
            const templateName = this.fileToTemplateName(filename)

            let compiled = compiler.compile(templateData, this.options.vue)
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
