import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// common middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// When you use app.use(express.static("public"));, any requests for static assets will be served directly from the public directory
app.use(express.static("public"));

// import routes
import healtcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import { erroHandler } from "./middlewares/error.middlewares.js";

// routes (we always create route using middlewares)
app.use("/api/v1/healthcheck", healtcheckRouter);
app.use("/api/v1/users", userRouter);

// app.use(erroHandler); // not really needed just an extra knowledge you can comment it
export { app };
