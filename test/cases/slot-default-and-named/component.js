// default and named slot
const san = require('san')
const Tab = san.defineComponent({
    template: '<div>' +
        '<div class="head"><slot name="title"></slot></div>' +
        '<div><slot></slot></div>' +
        '<u title="{{text}}"></u>' +
        '</div>'
})

const MyComponent = san.defineComponent({
    components: {
        'ui-tab': Tab
    },

    template: '<div><ui-tab text="{{tabText}}">' +
        '<h3 slot="title" title="{{title}}">{{title}}</h3>' +
        '<p title="{{text}}">{{text}}</p>' +
        '</ui-tab></div>'
})

exports = module.exports = MyComponent
