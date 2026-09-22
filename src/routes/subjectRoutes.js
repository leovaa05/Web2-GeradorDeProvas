// src/routes/subjectRoutes.js
import { Router } from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/subjectController.js";
import validate from "../middlewares/validate.js";
import {
  createSubjectSchema,
  idParamSchema,
  updateSubjectSchema,
} from "../schemas/subjectSchema.js";

const router = Router();

router.post("/", validate(createSubjectSchema), create);
router.get("/", getAll);
router.get("/:id", validate(idParamSchema, "params"), getById);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateSubjectSchema),
  update,
);
router.delete("/:id", validate(idParamSchema, "params"), remove);

export default router;
