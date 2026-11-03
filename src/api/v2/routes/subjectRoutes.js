import express from "express";
import * as subjectController from "../controllers/subjectController.js";
import validate from "../../../middlewares/validate.js";
import {
  createSubjectV2Schema,
  updateSubjectV2Schema,
  idParamSchema,
} from "../schemas/subjectSchema.js";

const router = express.Router();

router.post(
  "/",
  validate("body", createSubjectV2Schema),
  subjectController.create,
);

router.get("/", subjectController.getAll);

router.get(
  "/:id",
  validate("params", idParamSchema),
  subjectController.getById,
);

router.patch(
  "/:id",
  validate("params", idParamSchema),
  validate("body", updateSubjectV2Schema),
  subjectController.update,
);

router.delete(
  "/:id",
  validate("params", idParamSchema),
  subjectController.remove,
);

export default router;
