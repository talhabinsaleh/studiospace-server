import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import "./db";
import bookings from "./routes/bookings";
import studios from "./routes/studios";
import wishlist from "./routes/wishlist";
import { errorHandler } from "./utils";

const app = express();

app.use(
  cors({
    origin: (process.env.CLIENT_URL ?? "http://localhost:3000").split(","),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({ name: "StudioSpace API", status: "running" });
});

app.use("/api/studios", studios);
app.use("/api/bookings", bookings);
app.use("/api/wishlist", wishlist);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});
app.use(errorHandler);

export default app;
