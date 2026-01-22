import { Router } from "express";
import { QuestionController } from "../controllers/question.controller";

const router = Router();

router.get("/", QuestionController.getAll);
router.get("/:id", QuestionController.getById);
router.post("/", QuestionController.create);
router.patch("/:id", QuestionController.update);
router.delete("/:id", QuestionController.delete);

export default router;
