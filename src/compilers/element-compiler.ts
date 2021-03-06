import { ExprType, ANode } from 'san'
import { TypeGuards, autoCloseTags, getANodePropByName } from 'san-ssr'
import * as compileExprSource from '../compilers/expr-compiler'
import { PHPEmitter } from '../emitters/emitter'

/**
* element 的编译方法集合对象
*/
export class ElementCompiler {
    private compileANode: (aNode: ANode, emitter: PHPEmitter) => void

    constructor (compileANode: (aNode: ANode, emitter: PHPEmitter) => void) {
        this.compileANode = compileANode
    }
    /**
     * 编译元素标签头
     *
     * @param tagNameVariable 组件标签为外部动态传入时的标签变量名
     */
    tagStart (emitter: PHPEmitter, aNode: ANode, tagNameVariable?: string, noTemplateOutput = false) {
        const props = aNode.props
        const bindDirective = aNode.directives.bind
        const tagName = aNode.tagName

        if (tagName) {
            emitter.bufferHTMLLiteral('<' + tagName)
        } else if (noTemplateOutput) {
            return
        } else if (tagNameVariable) {
            emitter.bufferHTMLLiteral('<')
            emitter.writeHTML(`$${tagNameVariable} ? $${tagNameVariable} : "div"`)
        } else {
            emitter.bufferHTMLLiteral('<div')
        }

        // index list
        const propsIndex:any = {}
        for (const prop of props) {
            propsIndex[prop.name] = prop

            if (prop.name !== 'slot') {
                if (TypeGuards.isExprBoolNode(prop.expr)) {
                    emitter.bufferHTMLLiteral(' ' + prop.name)
                } else if (TypeGuards.isExprStringNode(prop.expr)) {
                    emitter.bufferHTMLLiteral(' ' + prop.name + '="' +
                        prop.expr.literal + '"')
                } else if (prop.expr.value != null) {
                    emitter.bufferHTMLLiteral(' ' + prop.name + '="' +
                        compileExprSource.expr(prop.expr) + '"')
                }
            }
        }

        for (const prop of props) {
            if (prop.name === 'slot' || prop.expr.value != null) {
                continue
            }

            if (prop.name === 'value') {
                switch (tagName) {
                case 'textarea':
                    continue

                case 'select':
                    emitter.writeLine('$selectValue = ' +
                        compileExprSource.expr(prop.expr) + '?' +
                        compileExprSource.expr(prop.expr) + ': "";'
                    )
                    continue

                case 'option':
                    emitter.writeLine('$optionValue = ' +
                        compileExprSource.expr(prop.expr) +
                        ';'
                    )
                    // value
                    emitter.writeIf('isset($optionValue)', () => {
                        emitter.writeHTML('" value=\\"" . $optionValue . "\\""')
                    })

                    // selected
                    emitter.writeIf('$optionValue == $selectValue', () => {
                        emitter.bufferHTMLLiteral(' selected')
                    })
                    continue
                }
            }

            switch (prop.name) {
            case 'readonly':
            case 'disabled':
            case 'multiple':
                if (prop.raw == null) {
                    emitter.bufferHTMLLiteral(' ' + prop.name)
                } else {
                    emitter.writeHTML('_::boolAttrFilter(\'' + prop.name + '\', ' +
                        compileExprSource.expr(prop.expr) +
                        ')'
                    )
                }
                break

            case 'checked':
                if (tagName === 'input') {
                    const valueProp = propsIndex.value
                    const valueCode = compileExprSource.expr(valueProp.expr)

                    if (valueProp) {
                        switch (propsIndex.type.raw) {
                        case 'checkbox':
                            emitter.writeIf(`_::contains(${compileExprSource.expr(prop.expr)}, ${valueCode})`, () => {
                                emitter.bufferHTMLLiteral(' checked')
                            })
                            break
                        case 'radio':
                            emitter.writeIf(`${compileExprSource.expr(prop.expr)} === ${valueCode}`, () => {
                                emitter.bufferHTMLLiteral(' checked')
                            })
                            break
                        }
                    }
                }
                break

            default:
                const onlyOneAccessor = prop.expr.type === ExprType.ACCESSOR
                emitter.writeHTML('_::attrFilter("' + prop.name + '", ' +
                    compileExprSource.expr(prop.expr) +
                    (prop.x || onlyOneAccessor ? ', true' : '') +
                    ')'
                )
                break
            }
        }

        if (bindDirective) {
            emitter.nextLine(`$bindObj = ${compileExprSource.expr(bindDirective.value)};`)
            emitter.writeForeach('$bindObj as $key => $value', () => {
                if (tagName === 'textarea') {
                    emitter.writeIf('$key == "value"', () => emitter.writeContinue())
                }

                emitter.writeSwitch('$key', () => {
                    emitter.writeCase('"readonly"')
                    emitter.writeCase('"disabled"')
                    emitter.writeCase('"multiple"')
                    emitter.writeCase('"checked"', () => {
                        emitter.writeLine('$html .= _::boolAttrFilter($key, $value);')
                        emitter.writeBreak()
                    })
                    emitter.writeDefault(() => {
                        emitter.writeLine('$html .= _::attrFilter($key, $value, true);')
                    })
                })
            })
        }

        emitter.bufferHTMLLiteral('>')
    }

    /**
     * 编译元素闭合
     *
     * @param tagNameVariable 组件标签为外部动态传入时的标签变量名
     */
    tagEnd (emitter: PHPEmitter, aNode: ANode, tagNameVariable?: string, noTemplateOutput = false) {
        const tagName = aNode.tagName

        if (tagName) {
            if (!autoCloseTags.has(tagName)) {
                emitter.bufferHTMLLiteral('</' + tagName + '>')
            }

            if (tagName === 'select') {
                emitter.writeLine('$selectValue = null;')
            }

            if (tagName === 'option') {
                emitter.writeLine('$optionValue = null;')
            }
        } else if (noTemplateOutput) {
            // nope
        } else {
            emitter.bufferHTMLLiteral('</')
            emitter.writeHTML(`$${tagNameVariable} ? $${tagNameVariable} : "div"`)
            emitter.bufferHTMLLiteral('>')
        }
    }

    // 编译元素内容
    inner (emitter: PHPEmitter, aNode: ANode) {
        if (aNode.tagName === 'textarea') {
            const valueProp = getANodePropByName(aNode, 'value')
            if (valueProp) {
                emitter.writeHTML(
                    '_::escapeHTML(' +
                    compileExprSource.expr(valueProp.expr) +
                    ')'
                )
            }
            return
        }

        const htmlDirective = aNode.directives.html
        if (htmlDirective) {
            emitter.writeHTML(compileExprSource.expr(htmlDirective.value))
        } else {
            for (const aNodeChild of aNode.children!) {
                this.compileANode(aNodeChild, emitter)
            }
        }
    }
}
