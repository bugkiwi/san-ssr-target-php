// select, null and undefined should select empty option, init undefined
const san = require('san')

const MyComponent = san.defineComponent({
    template: '<div>' +
        '<b title="{{online}}">{{online}}</b>' +
        '<select value="{=online=}">' +
        '<option s-for="p in persons">{{p}}</option>' +
        '<option value="">empty</option>' +
        '</select>' +
        '</div>'
})

exports = module.exports = MyComponent
