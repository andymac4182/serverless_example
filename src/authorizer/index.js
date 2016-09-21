import jwt from 'jsonwebtoken'
import AuthPolicy from './authPolicy'
import { handlerEnricher } from '../lib/logging'

const jwtSecret = 'INSERT JWT SECRET HERE'

const handler = (event, context, callback, log) => {
    log.info('Client token: {AuthorizationToken}', event.authorizationToken)
    log.info('Method ARN: {MethodArn}', event.methodArn)

    if (!event.authorizationToken) {
        callback('Could not find authToken')
        return
    }

    const authTokenSplit = event.authorizationToken.split(' ')
    const token = authTokenSplit[1]

    const apiOptions = {}
    const tmp = event.methodArn.split(':')
    const apiGatewayArnTmp = tmp[5].split('/')
    const awsAccountId = tmp[4]
    apiOptions.region = tmp[3]
    apiOptions.restApiId = apiGatewayArnTmp[0]
    apiOptions.stage = apiGatewayArnTmp[1]

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            log.error(
                'Failed jwt verification: {@Error} Token: {AuthorizationToken}',
                err,
                event.authorizationToken
                )

            const policy = new AuthPolicy('Unknown user', awsAccountId, apiOptions)
            policy.denyAllMethods()
            callback(null, policy.build())
        } else {
            log.info('Decoded jwq successfully {JWT}', decoded)
            const policy = new AuthPolicy(decoded.sub, awsAccountId, apiOptions)
            policy.allowAllMethods()

            const policyToReturn = policy.build()
            log.verbose('Returning policy to allow client access {@Policy}', policyToReturn)
            callback(null, policyToReturn)
        }
    })
}

exports.handler = handlerEnricher(handler)
