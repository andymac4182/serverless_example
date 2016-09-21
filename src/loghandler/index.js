import _ from 'lodash'
import zlib from 'zlib'
import request from 'request'
import moment from 'moment'
import { handlerEnricher } from '../lib/logging'


const handler = (event, context, cb, logger) => {
    const payload = new Buffer(event.awslogs.data, 'base64')
    zlib.gunzip(payload, (e, result) => {
        if (e) {
            logger.error('Error unziping log body {@Error}', e)
            cb(e)
        } else {
            const decodedResult = JSON.parse(result.toString('utf8'))
            const functionNameForLogs = decodedResult.logGroup.replace('/aws/lambda/', '')
            logger.debug('{FunctionName} Decoded payload: {@Payload}', functionNameForLogs, decodedResult)

            const seqBodyArray = []

            decodedResult.logEvents.forEach(logEvent => {
                if (logEvent.message.startsWith('START')) {
                    const logEventParts = logEvent.message.split(' ')
                    const newLogEvent = {
                        '@t': moment(logEvent.timestamp).format(),
                        '@mt': 'Start event {InvocationId} for {Version}',
                        '@l': 'Debug',
                        Version: logEventParts[4],
                        InvocationId: logEventParts[2],
                        ApplicationFunctionName: functionNameForLogs,
                    }
                    seqBodyArray.push(JSON.stringify(newLogEvent))
                    logger.info('Added {@Message} to seqBody', newLogEvent)
                } else if (logEvent.message.startsWith('END')) {
                    const logEventParts = logEvent.message.split(' ')
                    const newLogEvent = {
                        '@t': moment(logEvent.timestamp).add(1, 'second').format(),
                        '@mt': 'End event {InvocationId}',
                        '@l': 'Debug',
                        InvocationId: logEventParts[2],
                        ApplicationFunctionName: functionNameForLogs,
                    }
                    seqBodyArray.push(JSON.stringify(newLogEvent))
                    logger.info('Added {@Message} to seqBody', newLogEvent)
                } else if (logEvent.message.startsWith('REPORT')) {
                    const logEventParts = logEvent.message.replace('\t', ' ').split(' ')
                    const newLogEvent = {
                        '@t': moment(logEvent.timestamp).add(1, 'second').format(),
                        '@mt': 'Report event {InvocationId} Duration: {Duration}, Billed Duration: {BilledDuration}, Memory Size: {MemorySize}, Max Memory Used: {MaxMemoryUsed}',
                        '@l': 'Debug',
                        InvocationId: logEventParts[2],
                        Duration: logEventParts[4],
                        BilledDuration: logEventParts[7],
                        MemorySize: logEventParts[11],
                        MaxMemoryUsed: logEventParts[15],
                        ApplicationFunctionName: functionNameForLogs,
                    }
                    seqBodyArray.push(JSON.stringify(newLogEvent))
                    logger.info('Added {@Message} to seqBody', newLogEvent)
                } else {
                    const logEventParts = logEvent.message.split('\t', 3)
                    if (logEventParts.length !== 3) {
                        logger.verbose('Log event that doesn\'t match current rules {LogMessage}', logEvent.message)
                        return
                    }
                    if (logEventParts[2].charAt(0) === '{') {
                        const decodedMessage = JSON.parse(logEventParts[2])
                        if (decodedMessage['@t'] !== undefined) {
                            seqBodyArray.push(JSON.stringify(decodedMessage))
                            logger.info('Added {@Message} to seqBody', decodedMessage)
                        }
                    } else if (logEventParts[2].charAt(0) === '[') {
                        logger.verbose('Ignoring logmessage due to starting with [ {LogMessage}', logEvent.message)
                    } else {
                        const newLogEvent = {
                            '@t': moment(logEvent.timestamp).format(),
                            '@mt': 'Lambda Exception {InvocationId}',
                            '@l': 'Error',
                            '@x': logEventParts[2],
                            InvocationId: logEventParts[1],
                            ApplicationFunctionName: functionNameForLogs,
                        }
                        seqBodyArray.push(JSON.stringify(newLogEvent))
                        logger.info('Added {@Message} to seqBody', newLogEvent)
                    }
                }
            })

            const seqBody = _.join(seqBodyArray, '\r\n')
            logger.info('Concatenated all the logs together {@MessageBeingSend}', seqBody)
            request
                .post(__SEQ_URI__, {
                    qs: {
                        apiKey: __SEQ_API_KEY__,
                        clef: '',
                    },
                    body: seqBody,
                }, (uploadErr, uploadResponse, uploadBody) => {
                    if (uploadErr) {
                        logger.error('Error uploading logs to Seq {@Error}, Uri {Uri}', uploadErr, __SEQ_URI__)
                        cb(new Error(`Error uploading logs to Seq ${uploadErr.message} Uri ${__SEQ_URI__}`))
                        return
                    }
                    if (uploadResponse.statusCode !== 201) {
                        logger.error('Error uploading logs to Seq with incorrect statusCode {Error}, Uri {Uri}, {@Response}', uploadBody, __SEQ_URI__, uploadResponse)
                        cb(new Error('Error uploading logs to Seq with incorrect statusCode'))
                        return
                    }
                    logger.debug('Completed uploading logs to Seq {@UploadData}, Uri {Uri}', uploadBody, __SEQ_URI__)
                    cb()
                })
        }
    })
}

exports.handler = handlerEnricher(handler)
