// two way binding textarea value
const san = require('san')
const MyComponent = san.defineComponent({
    template: '<div><span title="{{name}}">{{name}}</span> <textarea value="{=name=}"></textarea></div>'
})

exports = module.exports = MyComponent
