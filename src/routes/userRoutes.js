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
  getUserWithVotes
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", createUser);
router.post('/login', loginUser);

router.get("/", protect, getUsers);
router.get("/:id", protect, getUser);
router.put("/", protect, updateUser);
router.patch("/:id/password", protect, changePassword);
router.delete("/:id", protect, deleteUser);
router.get("/:id/polls", protect, getUserWithPolls);
router.get("/:id/votes", protect, getUserWithVotes);

export default router;
