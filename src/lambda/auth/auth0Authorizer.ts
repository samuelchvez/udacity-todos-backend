import 'source-map-support/register';
import {
  CustomAuthorizerEvent,
  CustomAuthorizerResult,
} from 'aws-lambda';
import Axios from 'axios';

import { createLogger } from '../../utils/logger';
import { verifyToken, getDecodedTokenHeader } from './utils';
import { JwksResponse } from './JwksResponse';


const logger = createLogger('auth0Authorizer');

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    logger.info('Authorizing a user', event.authorizationToken);

    let cert;

    try {
      cert = await buildCert(
        'https://dev-xpq7j4qr.us.auth0.com/.well-known/jwks.json',
        event.authorizationToken,
      );
    } catch(e) {
      logger.error('User was not authorized', e);

      return deny();
    }

    const { sub } = verifyToken(
      event.authorizationToken,
      cert,
    );

    logger.info('User was authorized');

    return {
      principalId: sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
    };
  } catch (e) {
    logger.error('User was not authorized', e);

    return deny();
  }
};


function deny() {
  return {
    principalId: 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: '*',
        },
      ],
    },
  };
}


async function buildCert(jwksUrl: string, authorizationHeader: string): Promise<string> {
  const { data }  = await Axios.get(jwksUrl);
  const { kid } = getDecodedTokenHeader(authorizationHeader);
  const keys = (data as JwksResponse).keys.filter(key => key.kid === kid);

  if (keys.length < 1) {
    throw new Error('Invalid keys signature');
  }

  return [
    '-----BEGIN CERTIFICATE-----',
    keys[0].x5c[0],
    '-----END CERTIFICATE-----'
  ].join('\n');
}
