import express from "express";
import {
  createUser,
  loginUser,
  getUsers,
  getUser,
  updateUser,
  changePassword,
  deleteUser,
  getUserWithPolls,
  getUserWithVotes,
  getCurrentUser,
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();
// Public routes
router.post("/", createUser);
router.post("/login", loginUser);

// Protected routes (authentication required)
router.use(protect);
router.get("/", getUsers);
router.get("/me", getCurrentUser);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.patch("/:id/password", changePassword);
router.delete("/:id", deleteUser);
router.get("/:id/polls", getUserWithPolls);
router.get("/:id/votes", getUserWithVotes);

export default router;
