import { Router } from "express";
import { UserModelController } from "../controllers/user-model.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/role.middleware";

const router = Router();
const controller = new UserModelController();

// Middleware: Require authentication for all routes
router.use(authenticateUser);

/**
 * User routes - manage own models
 */

/**
 * GET /api/user-models/my-models
 * Get all models for the authenticated user
 */
router.get("/my-models", (req, res) => controller.getMyModels(req, res));

/**
 * POST /api/user-models/switch-model/:modelId
 * Switch active model context
 */
router.post("/switch-model/:modelId", (req, res) =>
  controller.switchModel(req, res)
);

/**
 * Admin routes - manage any user's models
 */

/**
 * GET /api/user-models/user/:userId/models
 * Get all models for a specific user (admin only)
 */
router.get("/user/:userId/models", requireAdmin, (req, res) =>
  controller.getUserModels(req, res)
);

/**
 * POST /api/user-models/user/:userId/models
 * Add a new model to a user (admin only)
 */
router.post("/user/:userId/models", requireAdmin, (req, res) =>
  controller.addModelToUser(req, res)
);

/**
 * DELETE /api/user-models/user/:userId/models/:modelId
 * Remove a model from a user (admin only)
 */
router.delete("/user/:userId/models/:modelId", requireAdmin, (req, res) =>
  controller.removeModelFromUser(req, res)
);

/**
 * PATCH /api/user-models/user/:userId/models/:modelId/toggle
 * Toggle active/inactive status of a user model (admin only)
 */
router.patch("/user/:userId/models/:modelId/toggle", requireAdmin, (req, res) =>
  controller.toggleModelStatus(req, res)
);

export default router;
