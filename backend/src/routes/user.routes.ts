import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();
const controller = new UserController();

// Todas as rotas requerem autenticação
router.use(authenticateUser);

// Obter utilizador atual
router.get("/me", (req, res) => controller.getCurrentUser(req, res));

// Rotas de admin
router.get("/", requireAdmin, (req, res) => controller.getAll(req, res));
router.get("/stats", requireAdmin, (req, res) => controller.getStats(req, res));
router.get("/:id", requireAdmin, (req, res) => controller.getById(req, res));
router.post("/", requireAdmin, (req, res) => controller.create(req, res));
router.patch("/:id", requireAdmin, (req, res) => controller.update(req, res));
router.delete("/:id", requireAdmin, (req, res) => controller.delete(req, res));

export default router;
