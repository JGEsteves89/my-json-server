# My-JSON-server

A lightweight, token-authenticated JSON file server with real-time WebSocket support. Store and retrieve JSON data files with built-in access control, rate limiting, and comprehensive logging.

## Attention - issues

There is currently many bugs, but this is serious: It affects when using the docker image:

```bash
[2025-10-24 22:50:53.247][SYSTEM][SERVER][startup]: Server started on http://localhost:3000
[2025-10-24 22:51:50.930][TEST_APP][POST][/this/is/a/test]: File created {
	path: '/../../../../../../app/data/TEST_APP/this/is/a/test',
	data: '{"foo":"bar"}'
}
```

## Features

- **RESTful API**: Simple HTTP endpoints for GET, POST (create/update), and DELETE operations
- **Token-based Authentication**: Secure API access using API tokens with per-app isolation
- **Real-time Updates**: WebSocket support for live notifications when files change
- **Rate Limiting**: Built-in protection against abuse with configurable rate limits
- **Easy to use**: Create, save or get a json. you can watch for changes on a given json.
- **Error Handling**: Standardized error responses with clear error codes and messages
- **Data Validation**: Request validation and path sanitization for security
- **ES Modules**: Modern JavaScript with ES6 modules support
- **Test Coverage**: Full test suite with Jest and Supertest

## Usage

| Method | Path     | Description                | Auth Required | Returns             |
| ------ | -------- | -------------------------- | ------------- | ------------------- |
| GET    | `/*path` | Retrieve JSON file         | Yes           | File content or 404 |
| POST   | `/*path` | Create or update JSON file | Yes           | Status and path     |
| DELETE | `/*path` | Delete JSON file           | Yes           | Status and path     |
| WS     | `/*path` | Subscribe to file changes  | Yes           | Real-time updates   |

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Setup

1. Clone the repository:

```bash
git clone https://github.com/JGEsteves89/my-json-server.git
cd my-json-server
```

2. If you need to set the remote origin manually (e.g., for existing repositories):

```bash
git remote add origin https://github.com/JGEsteves89/my-json-server.git
```

3. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## Docker Setup

You can run my-json-server using Docker:

1. Pull the image

```bash
docker pull ijimiguel/my-json-server:latest
```

(Or specify a version tag, e.g. :1.0.2)

2. Run the container with necessary environment variables and volume mounts:

```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/defaultApiKeys.json:/app/defaultApiKeys.json \
  -e API_TOKENS_PATH=/app/defaultApiKeys.json \
  -e PORT=3000 \
  --name my-json-server \
  ijimiguel/my-json-server:latest
```

This will:

- Map port 3000 from the container to your host
- Mount your local data directory to persist JSON files
- Mount the API keys file
- Set the required environment variables

## Configuration

Configure the server using environment variables:

```bash
# Server port
PORT=3000

# Data directory for storing JSON files
DATA_DIR=./data

# Path to JSON file containing API tokens (mapping app names to tokens)
API_TOKENS_PATH=./defaultApiKeys.json

# Rate limiting window (milliseconds)
RATE_LIMIT_WINDOW_MS=60000

# Rate limiting max requests per window
RATE_LIMIT_MAX=100
```

### Example

```bash
PORT=8080 \
DATA_DIR=./my_data \
API_TOKENS_PATH=./defaultApiKeys.json \
npm start
```

## Usage

### Starting the Server

```bash
npm start
```

### Running Tests

```bash
npm test
```

### Linting

```bash
# Check for lint errors
npm run lint

# Fix lint errors automatically
npm run lint:fix

# Format code with Prettier
npm run format
```

## API Endpoints

All endpoints require the `x-api-token` header with a valid API token.

### GET /\*path

Retrieve the JSON content of a file.

**Request:**

```bash
curl -H "x-api-token: YOUR_TOKEN" http://localhost:3000/mydata
```

**Response (200 OK):**

```json
{
  "key": "value",
  "nested": {
    "data": "example"
  }
}
```

**Response (404 Not Found):**

```json
{
  "error": "NOT_FOUND",
  "message": "The requested file could not be found",
  "statusCode": 404
}
```

### POST /\*path

Create or update a JSON file at the specified path.

**Request:**

```bash
curl -X POST \
  -H "x-api-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}' \
  http://localhost:3000/mydata
```

**Response (200 OK):**

```json
{
  "status": "created",
  "path": "/mydata"
}
```

Or if the file already exists:

```json
{
  "status": "updated",
  "path": "/mydata"
}
```

**Response (400 Bad Request):**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request body must be valid JSON",
  "statusCode": 400
}
```

### DELETE /\*path

Delete a JSON file at the specified path.

**Request:**

```bash
curl -X DELETE \
  -H "x-api-token: YOUR_TOKEN" \
  http://localhost:3000/mydata
```

**Response (200 OK):**

```json
{
  "status": "deleted",
  "path": "/mydata"
}
```

**Response (404 Not Found):**

```json
{
  "error": "NOT_FOUND",
  "message": "The requested file could not be found",
  "statusCode": 404
}
```

### WebSocket Connections

Connect to the WebSocket server to receive real-time updates when files change.

**Connect:**

```javascript
const ws = new WebSocket(`ws://localhost:3000/mydata`, {
  headers: { 'x-api-token': 'YOUR_TOKEN' },
});

ws.addEventListener('message', (event) => {
  const { path, data } = JSON.parse(event.data);
  console.log(`File ${path} changed:`, data);
});
```

**Message Format:**

```json
{
  "path": "/mydata",
  "data": {
    "key": "value"
  }
}
```

## API Endpoints Reference Table

| Method | Path     | Description                | Auth Required | Returns             |
| ------ | -------- | -------------------------- | ------------- | ------------------- |
| GET    | `/*path` | Retrieve JSON file         | Yes           | File content or 404 |
| POST   | `/*path` | Create or update JSON file | Yes           | Status and path     |
| DELETE | `/*path` | Delete JSON file           | Yes           | Status and path     |
| WS     | `/*path` | Subscribe to file changes  | Yes           | Real-time updates   |

## Error Codes

The API returns standardized error responses with the following codes:

| Error Code         | HTTP Status | Description                   |
| ------------------ | ----------- | ----------------------------- |
| `FORBIDDEN`        | 403         | Invalid or missing API token  |
| `NOT_FOUND`        | 404         | Requested file does not exist |
| `VALIDATION_ERROR` | 400         | Invalid path or request body  |
| `INTERNAL_ERROR`   | 500         | Server error (check logs)     |

## Project Structure

```
my-json-server/
├── src/
│   ├── server.js              # Express server setup
│   ├── routes.js              # API endpoint handlers
│   ├── apiTokenMiddleware.js   # Token validation middleware
│   ├── errorHandler.js         # Global error handler
│   ├── errors.js              # Error class definitions
│   ├── auth.js                # Authentication utilities
│   ├── config.js              # Configuration management
│   ├── logger.js              # Logging setup with Winston
│   ├── utils.js               # Utility functions
│   └── websocket.js           # WebSocket manager
├── tests/
│   └── server.test.js         # Test suite
├── data/                      # Default data storage directory
├── package.json               # Project metadata
└── README.md                  # This file
```

## Contributing

Contributions are welcome and encouraged! Please follow these guidelines:

1. **Fork the repository** and create a feature branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and ensure code quality

   ```bash
   npm run lint:fix
   npm run format
   ```

3. **Add or update tests** for new functionality

   ```bash
   npm test
   ```

4. **Commit with clear messages**

   ```bash
   git commit -m "feat: add new feature"
   ```

5. **Push to your branch** and create a Pull Request
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- Use ESLint for code quality: `npm run lint`
- Use Prettier for formatting: `npm run format`
- Follow the existing code patterns and conventions
- Write tests for new features

## License

This project is licensed under the MIT License - see below for details.

### MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

**Attribution:** When using this software, please acknowledge the original authors and include a reference to this project.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing documentation
- Review test cases for usage examples

## Changelog

### Version 1.0.2 (Current)

- Updated to version 1.0.2
- Changed from API_TOKENS environment variable to API_TOKENS_PATH for security and flexibility
- RESTful API endpoints
- WebSocket real-time updates
- Rate limiting
- Comprehensive logging
- Full test coverage
- Docker
