// update for, init with empty data
const san = require('san')
const MyComponent = san.defineComponent({
    template: '<ul>' +
        '<li>name - email</li>' +
        '<li san-for="p,i in persons" title="{{p.name}}">{{p.name}} - {{p.email}}</li>' +
        '<li>name - email</li>' +
        '</ul>'
})

exports = module.exports = MyComponent
