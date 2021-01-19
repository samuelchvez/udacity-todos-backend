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
    const userId = parseUserId(headers.Authorization);
    const { todoId } = pathParameters;

    try {
      await todosAccess.getTodo(userId, todoId);

      return {
        statusCode: 200,
        body: JSON.stringify({
          uploadUrl: todosAccess.generateTodoItemUploadImageUrl(todoId),
        }),
      };
    } catch(e) {
      return {
        statusCode: 403,
        body: e.message,
      };
    }
  }
);


handler
  .use(cors({ credentials: true }));

