import { Callback, Context, CustomAuthorizerEvent } from 'aws-lambda'
import * as jwt from 'jsonwebtoken'

export const handler = async (event: CustomAuthorizerEvent, _: Context, callback: Callback) => {
  if (!event.authorizationToken) {
    throw new Error('No token provided')
  }
  try {
    const policyDocument = await generatePolicyByJWT(event)
    callback(null, policyDocument)
  } catch (err) {
    callback(new Error('Unauthorized'))
  }
}

async function generatePolicyByJWT(event: CustomAuthorizerEvent) {
  const accessToken = getAccessTokenFromRequest(event)
  const jwtPayload = checkAccessToken(accessToken)
  return buildIAMPolicy('Allow', jwtPayload.id, jwtPayload)
}

function getAccessTokenFromRequest(event: any) {
  const regexValidBearerToken = /Bearer\s[a-zA-Z0-9.\-_]+/
  const authorizationHeader = event.authorizationToken

  if (!regexValidBearerToken.test(authorizationHeader)) {
    throw new Error('Invalid token format, should match bearer pattern')
  }

  const token = authorizationHeader.split('Bearer')[1]
  return token.trim()
}

function checkAccessToken(accessToken: string): any {
  try {
    return jwt.verify(accessToken.trim(), process.env.JWT_SECRET!) 
  } catch (error) {
    throw new Error('Unauthorized')
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
function buildIAMPolicy(effect: string, userId:string, context?: any) {
  const buildPolicyDocument = {} as any
  buildPolicyDocument.principalId = userId
  if (context) {
    Object.keys(context).forEach((key: any) => {
      if (context[key] === null) {
        delete context[key]
      }
    })
    buildPolicyDocument.context = context
  }

  return Object.assign(buildPolicyDocument, {
    policyDocument: {
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: '*',
        },
      ],
      Version: '2012-10-17',
    },
  })
}
