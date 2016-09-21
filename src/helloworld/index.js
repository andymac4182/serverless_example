import { handlerEnricher } from '../lib/logging'

const handler = (event, context, callback, log) => {
    callback(null, { Message: 'Hello World!'})
}

exports.handler = handlerEnricher(handler)
