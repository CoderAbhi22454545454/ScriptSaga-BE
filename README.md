
# ScriptSaga

ScriptSaga is a MERN stack application with a React frontend built using Vite and an Express backend.

## Project Structure

```
ScriptSaga/
│
├── frontend/   # React frontend built using Vite
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   ├── package.json
│   └── ...
│
├── backend/    # Express backend
│   ├── src/
│   ├── package.json
│   └── ...
│
└── README.md
```

## Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**

   ```sh
   git clone https://github.com/<your-username>/ScriptSaga.git
   cd ScriptSaga
   ```

2. **Setup Frontend**

   Navigate to the `frontend` directory and install the dependencies:

   ```sh
   cd frontend
   npm install
   ```

   Start the development server:

   ```sh
   npm run dev
   ```

   The frontend will be running at `http://localhost:3000` (or the port specified by Vite).

3. **Setup Backend**

   Open a new terminal, navigate to the `backend` directory and install the dependencies:

   ```sh
   cd backend
   npm install
   ```

   Start the server:

   ```sh
   npm run dev
   ```

   The backend will be running at `http://localhost:5000` (or the port specified in your server configuration).

### Development

- **Frontend Development**

  The frontend is built using [React](https://reactjs.org/) with [Vite](https://vitejs.dev/). To start the frontend development server, run:

  ```sh
  cd frontend
  npm run dev
  ```

- **Backend Development**

  The backend is built using [Express](https://expressjs.com/). To start the backend development server, run:

  ```sh
  cd backend
  npm run dev
  ```

### Deployment

For production builds and deployment, refer to the documentation of Vite for the frontend and the deployment guide for Node.js/Express for the backend.

### Contributing

1. Clone the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature`).
6. Open a pull request.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
