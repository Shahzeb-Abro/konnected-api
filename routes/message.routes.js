import { Router } from "express";
import { sendMediaMessage } from "../controllers/message.controllers.js";
import upload from "../middlewares/multer.middleware.js";
import { authorize } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/send-media-message",
  authorize,
  upload.array("files", 5),
  sendMediaMessage,
);

export default router;
