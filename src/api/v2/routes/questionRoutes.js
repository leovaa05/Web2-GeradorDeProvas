import express from "express";
import * as questionController from "../controllers/questionController.js";
import validate from "../../../middlewares/validate.js";
import {
  createQuestionV2Schema,
  updateQuestionV2Schema,
  idParamSchema,
} from "../schemas/questionSchema.js";

const router = express.Router();

router.post(
  "/",
  validate("body", createQuestionV2Schema),
  questionController.create,
);

router.get("/", questionController.getAll);

router.get(
  "/:id",
  validate("params", idParamSchema),
  questionController.getById,
);

router.patch(
  "/:id",
  validate("params", idParamSchema),
  validate("body", updateQuestionV2Schema),
  questionController.update,
);

router.delete(
  "/:id",
  validate("params", idParamSchema),
  questionController.remove,
);

export default router;
