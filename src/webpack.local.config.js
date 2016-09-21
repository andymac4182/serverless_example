const masterWebpack = require('./webpack.config')

const settings = {
    'process.env.NODE_ENV': JSON.stringify('local'),
    ENVIRONMENT_TYPE: JSON.stringify('local'),
    __APPLICATION_NAME__: JSON.stringify('Serverless.Example'),
    __APPLICATION_VERSION__: JSON.stringify('0.0.0.0'),
    __SEQ_URI__: JSON.stringify('https://localhost:5341/api/events/raw'),
    __SEQ_API_KEY__: JSON.stringify('TESTAPIKEY'),
}

module.exports = masterWebpack(settings)
