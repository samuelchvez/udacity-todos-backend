import 'source-map-support/register';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';

import { TodosAccess } from '../../dataLayer/todosAccess';
import { parseUserId } from '../auth/utils';
import { TodoUpdate } from '../../models/TodoUpdate';


const todosAccess = new TodosAccess();

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { headers, body, pathParameters } = event;
    const fields: TodoUpdate = JSON.parse(body);
    const todoId = pathParameters.todoId;
    const userId = parseUserId(headers.Authorization);

    try {
      await todosAccess.updateTodo(userId, todoId, fields);
    
      return {
        statusCode: 204,
        body: '',
      };
    } catch (e) {
      return {
        statusCode: 403,
        body: e.message,
      };
    }
  }
);


handler
  .use(cors({ credentials: true }));
