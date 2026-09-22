// src/routes/questionRoutes.js
import { Router } from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/questionController.js";
import validate from "../middlewares/validate.js";
import {
  createQuestionSchema,
  idParamSchema,
  updateQuestionSchema,
} from "../schemas/questionSchema.js";

const router = Router();

router.post("/", validate(createQuestionSchema), create);
router.get("/", getAll);
router.get("/:id", validate(idParamSchema, "params"), getById);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateQuestionSchema),
  update,
);
router.delete("/:id", validate(idParamSchema, "params"), remove);

export default router;
