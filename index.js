import http from "http";
import express from "express";
import "colors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createClient } from "redis";
import connectDB from "./utils/db.js";
dotenv.config();

// Routes
import authRoutes from "./routes/auth.routes.js";
import { initSocket } from "./socket/index.js";

const app = express();
const server = http.createServer(app);

// REDIS setup
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

const startServer = async () => {
  try {
    await connectDB();
    await pubClient.connect();
    await subClient.connect();
    console.log("Connected to Redis".cyan.underline);

    initSocket(server, pubClient, subClient);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`.bold.green);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`.red.bold);
  }
};

app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));

app.use("/api/v1/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

startServer();
