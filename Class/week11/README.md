Application Instructions
This project is divided into two parts:

Client Application
A React application built with Vite to render web content and fetch data from the server. To run the client application:

Open a terminal and navigate to the client folder.
Run npm install to install the dependencies.
Once installation is complete, run npm run dev to start the development server.


Server Application
The backend server handles API requests and data processing. To run the server application:

Navigate to the server folder.
Run npm install to install the dependencies.
Start both the client and server applications.

Environment Variables
You will need a .env file in both the client and server folders with the following variables:

Client (client/.env):
VITE_SERVER_URL
VITE_JWT_SECRET

Note: When using Vite, all environment variables must be prefixed with 'VITE_'.

Server (server/.env):
PORT
MONGO_URI
JWT_SECRET

