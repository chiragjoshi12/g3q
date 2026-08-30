# ExpressJS + MySQL Template

This template provides a structured starting point for building an Express.js application with MySQL. It follows best practices by organizing the code into separate directories for routes, controllers, models, services, and other utilities.

## Project Structure

| Folder/File         | Description                                      |
|--------------------|--------------------------------------------------|
| `src/`             | Main source code directory.                     |
| `src/app.js`       | Entry point of the application.                  |
| `src/routes/`      | Defines all API routes.                          |
| `src/controllers/` | Handles request logic for each route.            |
| `src/services/`    | Contains business logic and database interactions. |
| `src/models/`      | Defines database models and schemas.             |
| `src/middlewares/` | Custom middleware functions (e.g., authentication, logging). |
| `src/helpers/`     | Utility functions for various tasks.             |
| `src/validators/`  | Request validation rules using Zod. |
| `src/utils/`       | Common utilities and helper functions.           |
| `src/config/`      | Configuration files (e.g., database settings, environment variables). |

## Setup Instructions

Follow these steps to set up and run the application:

### 1. Clone the repository
Run the following command in your terminal:
```sh
git clone https://github.com/uiflowin/expressjs-mysql-template.git
cd expressjs-mysql-template
```

### 2. Install dependencies
Use npm to install all required dependencies:
```sh
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory copy the `.env.example` and add your configuration settings, such as database connection details.

### 4. Start the application
Run the application using:
```sh
npm start
```

For development with automatic reload:
```sh
npm run dev
```
