// checkbox checked
const san = require('san')
const MyComponent = san.defineComponent({
    template: '<div>' +
        '<b title="{{online}}">{{online}}</b>' +
        '<select value="{=online=}">' +
        '<option value="{{p}}" san-for="p in persons">{{p}}</option>' +
        '</select>' +
        '</div>'
})

exports = module.exports = MyComponent
