process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const environment = require('./webpack/environment')

module.exports = environment.toWebpackConfig()
