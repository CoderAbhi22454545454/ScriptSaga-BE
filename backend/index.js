import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import { connectDB } from "./utils/db.js"
import userRoute from "./route/user.route.js"
import classRoutes from "./route/class.route.js";
import githubRoutes from "./route/github.route.js"
import leetcodeRoutes from "./route/leetcode.route.js"
import assignmentRoutes from "./route/assignmentRoutes.js"
import metricsRoutes from "./routes/metrics.route.js";
import teacherRoutes from "./route/teacher.route.js";
dotenv.config()

const app = express()

// Middelwares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser())

app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:3000',
        'http://localhost:5000',
        'https://script-saga.vercel.app',
        'https://scriptsaga.vercel.app',
        'https://scriptsaga-production.up.railway.app',
        'https://strangerscript.vercel.app',
        'https://strangerscript-production.up.railway.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Credentials'
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Add headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    next();
});

const port = process.env.PORT || 6900

// ---- APIS -------
app.use("/api/v1/user", userRoute)
// Use class routes
app.use('/api/v1/class', classRoutes);
// Github Routes
app.use('/api/v1/', githubRoutes );
// Leetcode Routes
app.use('/api/v1/' , leetcodeRoutes)
// Assignment Routes
app.use('/api/v1/assignment', assignmentRoutes)

// Metrics Routes
app.use('/api/v1/metrics', metricsRoutes);
// Teacher Routes
app.use('/api/v1/teacher', teacherRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    connectDB()
    console.log(`Server is running on ${port}`);
})