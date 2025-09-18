// src/controllers/voteController.js
import { catchAsync } from "../middlewares/errorHandler.js";
import { VoteService } from "../services/voteService.js";

/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Vote management endpoints
 */

/**
 * @swagger
 * /votes/polls/{pollId}:
 *   post:
 *     summary: Cast a vote on a poll
 *     tags: [Votes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *       - in: query
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll Option ID
 *     responses:
 *       200:
 *         description: Vote cast successfully with real-time update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     vote:
 *                       $ref: '#/components/schemas/Vote'
 *                     results:
 *                       $ref: '#/components/schemas/PollResults'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Poll is not published or invalid option
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: User has already voted on this poll
 */
export const castVote = catchAsync(async (req, res) => {
  const voteService = new VoteService(req.models, req.app.get('wss'));
  const { optionId } = req.query;
  
  const result = await voteService.castVote(
    req.params.pollId,
    optionId,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * @swagger
 * /votes/polls/{pollId}/my-vote:
 *   get:
 *     summary: Get current user's vote for a poll
 *     tags: [Votes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: User's vote details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     vote:
 *                       $ref: '#/components/schemas/Vote'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User has not voted on this poll
 */
export const getMyVote = catchAsync(async (req, res) => {
  const voteService = new VoteService(req.models, req.app.get('wss'));
  const vote = await voteService.getUserVoteForPoll(
    req.params.pollId,
    req.user.id
  );

  if (!vote) {
    return res.status(404).json({
      status: "fail",
      message: "You have not voted on this poll",
    });
  }

  res.status(200).json({
    status: "success",
    data: { vote },
  });
});

/**
 * @swagger
 * /votes/polls/{pollId}/has-voted:
 *   get:
 *     summary: Check if current user has voted on a poll
 *     tags: [Votes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Vote status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasVoted:
 *                       type: boolean
 *                       example: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const hasVoted = catchAsync(async (req, res) => {
  const voteService = new VoteService(req.models, req.app.get('wss'));
  const hasVoted = await voteService.hasUserVotedOnPoll(
    req.params.pollId,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: { hasVoted },
  });
});

/**
 * @swagger
 * /votes/polls/{pollId}:
 *   get:
 *     summary: Get all votes for a poll (Admin only)
 *     tags: [Votes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of votes per page
 *     responses:
 *       200:
 *         description: List of votes with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     votes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vote'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator or admin
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const getPollVotes = catchAsync(async (req, res) => {
  const voteService = new VoteService(req.models, req.app.get('wss'));
  
  // Check if user is the poll creator or has admin rights
  const poll = await req.models.Poll.find(req.params.pollId);
  if (!poll) {
    return res.status(404).json({
      status: "fail",
      message: "Poll not found",
    });
  }

  if (poll.creatorId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({
      status: "fail",
      message: "You can only view votes for your own polls",
    });
  }

  const result = await voteService.getVotesForPoll(
    req.params.pollId,
    req.query
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * @swagger
 * /votes/options/{optionId}:
 *   get:
 *     summary: Get all votes for a poll option (Admin only)
 *     tags: [Votes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll Option ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of votes per page
 *     responses:
 *       200:
 *         description: List of votes for the option with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     votes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Vote'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator or admin
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const getOptionVotes = catchAsync(async (req, res) => {
  const voteService = new VoteService(req.models, req.app.get('wss'));
  
  // Check if user is the poll creator or has admin rights
  const option = await req.models.PollOption.find(req.params.optionId);
  if (!option) {
    return res.status(404).json({
      status: "fail",
      message: "Poll option not found",
    });
  }

  const poll = await req.models.Poll.find(option.pollId);
  if (poll.creatorId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({
      status: "fail",
      message: "You can only view votes for your own polls",
    });
  }

  const result = await voteService.getVotesForOption(
    req.params.optionId,
    req.query
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * @swagger
 * /votes/polls/{pollId}/statistics:
 *   get:
 *     summary: Get voting statistics for a poll
 *     tags: [Votes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Voting statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       $ref: '#/components/schemas/VoteStatistics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator or admin
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const getVotingStatistics = catchAsync(async (req, res) => {
  const voteService = new VoteService(req.models, req.app.get('wss'));
  
  // Check if user is the poll creator or has admin rights
  const poll = await req.models.Poll.find(req.params.pollId);
  if (!poll) {
    return res.status(404).json({
      status: "fail",
      message: "Poll not found",
    });
  }

  if (poll.creatorId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({
      status: "fail",
      message: "You can only view statistics for your own polls",
    });
  }

  const statistics = await voteService.getVotingStatistics(req.params.pollId);

  res.status(200).json({
    status: "success",
    data: { statistics },
  });
});

/**
 * @swagger
 * /votes/{voteId}:
 *   delete:
 *     summary: Retract a vote (within time limit)
 *     tags: [Votes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: voteId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vote ID
 *     responses:
 *       200:
 *         description: Vote retracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Vote retracted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the vote owner or vote cannot be retracted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const retractVote = catchAsync(async (req, res) => {
  const voteService = new VoteService(req.models, req.app.get('wss'));
  await voteService.retractVote(req.params.voteId, req.user.id);

  res.status(200).json({
    status: "success",
    message: "Vote retracted successfully",
  });
});
