import cors from "cors";
import express from "express";
import router from "../routes/routes";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors());

  app.use("/api", router);
  return app;
}
