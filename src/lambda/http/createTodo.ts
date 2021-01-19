import 'source-map-support/register';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import * as uuid from 'uuid';
import * as middy from 'middy';
import { cors } from 'middy/middlewares';

import { CreateTodoRequest } from '../../requests/CreateTodoRequest';
import { parseUserId } from '../auth/utils';
import { TodosAccess } from '../../dataLayer/todosAccess';


const todosAccess = new TodosAccess();
const todosBucket = process.env.TODOS_S3_BUCKET;
const todosBucketRegion = process.env.TODOS_S3_BUCKET_REGION;

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const { headers, body } = event;
    const todoPayload: CreateTodoRequest = JSON.parse(body);
    const createdAt = new Date().toISOString();
    const userId = parseUserId(headers.Authorization);
    const todoId = uuid.v4();
    const newTodo = await todosAccess.createTodo(
      userId,
      {
        userId,
        todoId,
        createdAt,
        ...todoPayload,
        done: false,
        attachmentUrl: `https://${todosBucket}.s3.${todosBucketRegion}.amazonaws.com/${todoId}`,
      },
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        item: newTodo,
      }),
    };
  }
);


handler
  .use(cors({ credentials: true }));
