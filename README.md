# udacity-todos-backend

Repo for Udacity's Cloud Developer 5th Course (serverless application).

For client application test purposes use the folowing `config.ts`:

```Typescript
const apiId = 'szlmm09k3h';
export const apiEndpoint = `https://${apiId}.execute-api.us-east-2.amazonaws.com/dev`

export const authConfig = {
  domain: 'dev-xpq7j4qr.us.auth0.com',
  clientId: '2U9FkpD4hmCeyOuarKWVWNPPttM634Ss',
  callbackUrl: 'http://localhost:3000/callback',
}
```

*Note:* region is `us-east-2` not `us-east-1` as config.ts original default.

*Client repo:* https://github.com/samuelchvez/udacity-todos-client
