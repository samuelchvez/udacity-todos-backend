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
    const { headers, pathParameters } = event;
    const { todoId } = pathParameters;
    const userId = parseUserId(headers.Authorization);
    const todoToDelete = await todosAccess.getTodo(userId, todoId);

    try {
      await todosAccess.deleteTodo(userId, todoToDelete);
    
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
