/* eslint-disable */
import { handlerEnricher } from '../lib/logging'

const handler = (event, context, callback, log) => {
    //const eventData = JSON.parse(event.body)

    event.body.logs.forEach(logEvent => {
        console.log(JSON.stringify(logEvent))
    })    
}

exports.handler = handlerEnricher(handler)
