import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as S3 from 'aws-sdk/clients/s3';

import { createLogger } from '../utils/logger';
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';


const logger = createLogger('todosAccess');
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly s3: S3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosIndex = process.env.TODOS_INDEX,
    private readonly todosBucket = process.env.TODOS_S3_BUCKET,
    private readonly todosUploadUrlExpiration = process.env.TODOS_UPLOAD_SIGNED_URL_EXPIRATION,
  ) {}

  async getTodo(userId: string, todoId: string): Promise<TodoItem> {
    logger.info(
      'Getting todo item',
      { userId: userId, todoId },
    );

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIndex,
      KeyConditionExpression: 'userId = :userId AND todoId = :todoId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':todoId': todoId,
      },
    }).promise();

    if (result.Count !== 0) {
      return result.Items[0] as TodoItem;
    }

    throw new Error('Todo Item not found');
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
    logger.info(
      'Getting all TodoItems from DynamoDB',
      { userId }
    );

    const result = await this.docClient.query({
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }).promise();

    return result.Items as TodoItem[];
  }

  async createTodo(userId: string, todo: TodoItem): Promise<TodoItem> {
    logger.info(
      'Creating a Todo Item',
      { userId: userId },
    );

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo,
    }).promise();

    return todo;
  }

  async deleteTodo(userId: string, todo: TodoItem): Promise<TodoItem> {
    logger.info(
      'Deleting a Todo Item',
      { userId: userId, todoId: todo.todoId },
    );

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        createdAt: todo.createdAt,
      },
      ConditionExpression: 'todoId = :todoId',
      ExpressionAttributeValues: {
        ':todoId': todo.todoId,
      },
    }).promise();

    return todo;
  }

  async updateTodo(userId: string, todoId: string, fields: TodoUpdate): Promise<void> {
    logger.info(
      'Updating item',
      { userId: userId, todoId },
    );

    const todo = await this.getTodo(userId, todoId);

    if (todo.userId !== userId) {
      throw new Error('Not authorized');
    }

    const { createdAt } = todo;

    const updateExpression = Object.keys(fields).map(
      key => {
        if (key !== 'name') {
          return `${key} = :${key}`;
        }

        return '#nm = :nm';
      }
    ).join(', ');
    const updateExpressionAttributeValues = {};

    let nameUpdated = Object.keys(fields).includes('name');
  
    Object.entries(fields).forEach(
      ([key, value]) => {
        if (key !== 'name') {
          updateExpressionAttributeValues[`:${key}`] = value;
        } else {
          updateExpressionAttributeValues[':nm'] = value;
        }
      },
    );

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        userId: userId,
        createdAt,
      },
      UpdateExpression: `set ${updateExpression}`,
      ConditionExpression: 'todoId = :todoId',
      ExpressionAttributeValues: {
        ...updateExpressionAttributeValues,
        ':todoId': todoId,
      },
      ExpressionAttributeNames: nameUpdated ? {
        '#nm': 'name',
      } : undefined,
      ReturnValues: 'NONE',
    }).promise();
  }

  generateTodoItemUploadImageUrl(todoId: string): string {
    return this.s3.getSignedUrl(
      'putObject',
      {
        Bucket: this.todosBucket,
        Key: todoId,
        Expires: this.todosUploadUrlExpiration,
      },
    );
  }
}