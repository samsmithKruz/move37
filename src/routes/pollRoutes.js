// src/routes/polllRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  addPollOption,
  createPoll,
  deletePoll,
  deletePollOption,
  getPoll,
  getPollOption,
  getPollOptions,
  getPollResults,
  getPolls,
  getUserPolls,
  getUserVote,
  hasUserVoted,
  publishPoll,
  unpublishPoll,
  updatePoll,
  updatePollOption,
  voteOnPoll,
} from "../controllers/pollController.js";

const router = express.Router();

// Public routes
router.get("/", getPolls);
router.get("/:id", getPoll);
router.get("/:id/results", getPollResults);
router.get("/:pollId/options", getPollOptions);
router.get("/:pollId/options/:optionId", getPollOption);

// Protected routes (authentication required)
router.use(protect);
router.post("/", createPoll);
router.get("/user/:userId", getUserPolls);
router.put("/:id", updatePoll);
router.delete("/:id", deletePoll);
router.patch("/:id/publish", publishPoll);
router.patch("/:id/unpublish", unpublishPoll);
router.get("/:id/has-voted", hasUserVoted);
router.get("/:id/my-vote", getUserVote);
router.post("/:pollId/options", addPollOption);
router.put("/:pollId/options/:optionId", updatePollOption);
router.delete("/:pollId/options/:optionId", deletePollOption);
router.post("/:pollId/vote/:optionId", voteOnPoll);
export default router;
