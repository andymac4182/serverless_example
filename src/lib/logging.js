/* eslint-disable */

const structuredLog = require('structured-log')
const consoleSink = require('structured-log/console-sink')
const seqSink = require('structured-log-seq-sink');

function SerilogCompactJsonConsoleSink() {
    const self = this

    self.emit = (evts) => {
        evts.forEach((evt) => {
            const outputObject = evt.properties
            Object.assign(outputObject, {
                '@t': evt.timestamp.toISOString(),
                '@mt': evt.messageTemplate.raw,
            })

            if (evt.level === 'ERROR') {
                outputObject['@l'] = 'Error'
                console.error(JSON.stringify(outputObject))
            } else if (evt.level === 'WARN') {
                outputObject['@l'] = 'Warning'
                console.warn(JSON.stringify(outputObject))
            } else if (evt.level === 'INFO') {
                outputObject['@l'] = 'Information'
                console.info(JSON.stringify(outputObject))
            } else if (evt.level === 'VERBOSE') {
                outputObject['@l'] = 'Verbose'
                console.log(JSON.stringify(outputObject))
            } else {
                outputObject['@l'] = 'Debug'
                console.log(JSON.stringify(outputObject))
            }
        })
    }
}

const logFactory = (context, event, dontEnrich) => {
    let log = structuredLog.configure()
        .minLevel('VERBOSE')
        .enrich({
            ApplicationName: __APPLICATION_NAME__,
            ApplicationVersion: __APPLICATION_VERSION__,
            ApplicationFunctionName: context.functionName,
        })

    if(context && !dontEnrich)
    {
        log = log.enrich({ 'LambdaContext': context }, true)
    }

    if(event && !dontEnrich)
    {
        log = log.enrich({ 'LambdaEvent': event }, true)
    }

    log = log.writeTo(consoleSink())

    if (process.env.NODE_ENV === "production")
    {
        log = log.writeTo(new SerilogCompactJsonConsoleSink())
    } else {
        log = log.writeTo(seqSink({url: 'http://localhost:5341/'}))
    }

    return log.create()
}

const handlerEnricher = (handlerFunc, dontEnrich) => {
    return (event, context, cb) => {
        const log = logFactory(context, event, dontEnrich)
        log.info('Received request Event: {@Event} Context: {@Context}', event, context)
        handlerFunc(event, context, cb, log)
    }
} 

module.exports.logFactory = logFactory
module.exports.handlerEnricher = handlerEnricher
