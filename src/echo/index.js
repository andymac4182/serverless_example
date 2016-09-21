import { handlerEnricher } from '../lib/logging'

const handler = (event, context, callback, log) => {
    callback(null, event)
}

exports.handler = handlerEnricher(handler)
