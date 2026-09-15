// src/routes/subjectRoutes.js
import { Router } from "express";
import { create, getAll, getById } from "../controllers/subjectController.js";

const router = Router();

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getById);

export default router;
