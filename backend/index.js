import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import { connectDB } from "./utils/db.js"
import userRoute from "./route/user.route.js"
import classRoutes from "./route/class.route.js";
import githubRoutes from "./route/github.route.js"

dotenv.config()

const app = express()

// Middelwares
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use(cors({
    origin: 'http://localhost:5173', // or the port where your React app is running
    credentials: true,
}));


const port = process.env.PORT || 6900

// ---- APIS -------
app.use("/api/v1/user", userRoute)
// Use class routes
app.use('/api/v1/class', classRoutes);
// Github Routes
app.use('/api/v1/', githubRoutes );


// Error handling middleware 
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    connectDB()
    console.log(`Server is running on ${port}`);
})