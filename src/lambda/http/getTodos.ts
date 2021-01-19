import 'source-map-support/register';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';

import { TodosAccess } from '../../dataLayer/todosAccess';
import { parseUserId } from '../auth/utils';


const todosAccess = new TodosAccess();

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { headers } = event;
    const userId = parseUserId(headers.Authorization);
    const todos = await todosAccess.getAllTodos(userId);
  
    return {
      statusCode: 200,
      body: JSON.stringify({
        items: todos,
      }),
    };
  }
);


handler
  .use(cors({ credentials: true }));
