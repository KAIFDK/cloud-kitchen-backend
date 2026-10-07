import productRoutes from "./routes/product.routes";
import authRoutes from "./routes/auth.routes";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Cloud Kitchen API is running",
  });
});

export default app;