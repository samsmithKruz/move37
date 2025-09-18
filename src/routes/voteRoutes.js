// src/routes/voteRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  castVote,
  getMyVote,
  hasVoted,
  getPollVotes,
  getOptionVotes,
  getVotingStatistics,
  retractVote,
} from "../controllers/voteController.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Vote operations
router.post("/polls/:pollId", castVote);
router.get("/polls/:pollId/my-vote", getMyVote);
router.get("/polls/:pollId/has-voted", hasVoted);
router.delete("/:voteId", retractVote);

// Admin/creator only routes
router.get("/polls/:pollId", getPollVotes);
router.get("/options/:optionId", getOptionVotes);
router.get("/polls/:pollId/statistics", getVotingStatistics);

export default router;
