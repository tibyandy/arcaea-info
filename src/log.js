const util = require('node:util')

module.exports = log

function log (msg, ...args) {
    // const now = Math.floor(performance.now() * 10)
    // console.log(((now % 10 === 0) ? now + 1 : now) / 10000, msg, ...args.map(x => util.inspect(x, { depth: 30, colors: true, breakLength: 180 })))
}