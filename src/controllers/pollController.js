// src/controllers/pollController.js
import { catchAsync } from "../middlewares/errorHandler.js";
import { PollService } from "../services/pollService.js";

/**
 * @swagger
 * tags:
 *   name: Polls
 *   description: Poll management endpoints
 */

/**
 * @swagger
 * /websocket-stats:
 *   get:
 *     summary: Get websocket status
 *     tags: [WebSocket]
 *     responses:
 *       200:
 *         description: Poll created successfully
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
 *                     poll:
 *                       $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
/**
 * @swagger
 * /polls:
 *   post:
 *     summary: Create a new poll
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - options
 *             properties:
 *               question:
 *                 type: string
 *                 example: What is your favorite programming language?
 *               isPublished:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *               options:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: object
 *                   required:
 *                     - text
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: JavaScript
 *     responses:
 *       201:
 *         description: Poll created successfully
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
 *                     poll:
 *                       $ref: '#/components/schemas/Poll'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export const createPoll = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const pollData = {
    question: req.body.question,
    creatorId: req.user.id,
    isPublished: req.body.isPublished || false,
  };

  const poll = await pollService.createPoll(pollData, req.body.options);

  res.status(201).json({
    status: "success",
    data: { poll },
  });
});

/**
 * @swagger
 * /polls:
 *   get:
 *     summary: Get all published polls
 *     tags: [Polls]
 *     parameters:
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
 *           default: 20
 *         description: Number of polls per page
 *       - in: query
 *         name: creatorId
 *         schema:
 *           type: string
 *         description: Filter by creator ID
 *     responses:
 *       200:
 *         description: List of published polls
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
 *                     polls:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Poll'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
export const getPolls = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const result = await pollService.getPublishedPolls(req.query);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * @swagger
 * /polls/{id}:
 *   get:
 *     summary: Get a poll by ID
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *       - in: query
 *         name: includeResults
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include vote results
 *     responses:
 *       200:
 *         description: Poll details
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
 *                     poll:
 *                       $ref: '#/components/schemas/Poll'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       403:
 *         description: Poll is not published
 */
export const getPoll = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const includeResults = req.query.includeResults === "true";
  const poll = await pollService.getPollById(req.params.id, includeResults);

  res.status(200).json({
    status: "success",
    data: { poll },
  });
});

/**
 * @swagger
 * /polls/user/{userId}:
 *   get:
 *     summary: Get polls created by a specific user
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *           default: 20
 *         description: Number of polls per page
 *     responses:
 *       200:
 *         description: User's polls with vote counts
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
 *                     polls:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Poll'
 *                           - type: object
 *                             properties:
 *                               options:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     voteCount:
 *                                       type: integer
 *                               totalVotes:
 *                                 type: integer
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const getUserPolls = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const result = await pollService.getUserPolls(req.params.userId, req.query);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * @swagger
 * /polls/{id}:
 *   put:
 *     summary: Update a poll
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 example: Updated question?
 *               isPublished:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Poll updated successfully
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
 *                     poll:
 *                       $ref: '#/components/schemas/Poll'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const updatePoll = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const poll = await pollService.updatePoll(
    req.params.id,
    req.user.id,
    req.body
  );

  res.status(200).json({
    status: "success",
    data: { poll },
  });
});

/**
 * @swagger
 * /polls/{id}:
 *   delete:
 *     summary: Delete a poll
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       204:
 *         description: Poll deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const deletePoll = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  await pollService.deletePoll(req.params.id, req.user.id);

  res.status(204).json({
    status: "success",
    message: "Poll deleted successfully",
  });
});

/**
 * @swagger
 * /polls/{pollId}/vote/{optionId}:
 *   post:
 *     summary: Vote on a poll option
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *       - in: path
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
export const voteOnPoll = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const result = await pollService.voteOnPoll(
    req.params.pollId,
    req.params.optionId,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * @swagger
 * /polls/{id}/results:
 *   get:
 *     summary: Get poll results with vote counts
 *     tags: [Polls]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll results with vote counts and percentages
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
 *                     results:
 *                       $ref: '#/components/schemas/PollResults'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       403:
 *         description: Poll is not published
 */
export const getPollResults = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const results = await pollService.getPollResults(req.params.id);

  res.status(200).json({
    status: "success",
    data: { results },
  });
});

/**
 * @swagger
 * /polls/{id}/publish:
 *   patch:
 *     summary: Publish a poll
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll published successfully
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
 *                     poll:
 *                       $ref: '#/components/schemas/Poll'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const publishPoll = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const poll = await pollService.publishPoll(req.params.id, req.user.id);

  res.status(200).json({
    status: "success",
    data: { poll },
  });
});

/**
 * @swagger
 * /polls/{id}/unpublish:
 *   patch:
 *     summary: Unpublish a poll
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll unpublished successfully
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
 *                     poll:
 *                       $ref: '#/components/schemas/Poll'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const unpublishPoll = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const poll = await pollService.unpublishPoll(req.params.id, req.user.id);

  res.status(200).json({
    status: "success",
    data: { poll },
  });
});

/**
 * @swagger
 * /polls/{id}/has-voted:
 *   get:
 *     summary: Check if current user has voted on a poll
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
export const hasUserVoted = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const hasVoted = await pollService.hasUserVoted(req.params.id, req.user.id);

  res.status(200).json({
    status: "success",
    data: { hasVoted },
  });
});

/**
 * @swagger
 * /polls/{id}/my-vote:
 *   get:
 *     summary: Get current user's vote for a poll
 *     tags: [Polls]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
export const getUserVote = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const vote = await pollService.getUserVote(req.params.id, req.user.id);

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
 * /polls/{pollId}/options:
 *   post:
 *     summary: Add a new option to an existing poll
 *     tags: [Poll Options]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: New Option
 *     responses:
 *       201:
 *         description: Option added successfully
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
 *                     option:
 *                       $ref: '#/components/schemas/PollOption'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Option already exists
 */
export const addPollOption = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const optionData = {
    text: req.body.text,
    pollId: req.params.pollId,
  };

  const option = await pollService.addPollOption(optionData);

  res.status(201).json({
    status: "success",
    data: { option },
  });
});

/**
 * @swagger
 * /polls/{pollId}/options:
 *   get:
 *     summary: Get all options for a poll
 *     tags: [Poll Options]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: List of poll options
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
 *                     options:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PollOption'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const getPollOptions = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const options = await pollService.getPollOptions(req.params.pollId);

  res.status(200).json({
    status: "success",
    data: { options },
  });
});

/**
 * @swagger
 * /polls/{pollId}/options/{optionId}:
 *   get:
 *     summary: Get a specific poll option
 *     tags: [Poll Options]
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Option ID
 *     responses:
 *       200:
 *         description: Poll option details
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
 *                     option:
 *                       $ref: '#/components/schemas/PollOption'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const getPollOption = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const option = await pollService.getPollOption(req.params.optionId);

  res.status(200).json({
    status: "success",
    data: { option },
  });
});

/**
 * @swagger
 * /polls/{pollId}/options/{optionId}:
 *   put:
 *     summary: Update a poll option
 *     tags: [Poll Options]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Option ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: Updated Option Text
 *     responses:
 *       200:
 *         description: Option updated successfully
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
 *                     option:
 *                       $ref: '#/components/schemas/PollOption'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Option already exists
 */
export const updatePollOption = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  const option = await pollService.updatePollOption(
    req.params.optionId,
    req.body,
    req.user.id
  );

  res.status(200).json({
    status: "success",
    data: { option },
  });
});

/**
 * @swagger
 * /polls/{pollId}/options/{optionId}:
 *   delete:
 *     summary: Delete a poll option
 *     tags: [Poll Options]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pollId
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Option ID
 *     responses:
 *       200:
 *         description: Option deleted successfully
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
 *                   example: Option deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Not the poll creator
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Cannot delete option that has votes or would leave less than 2 options
 */
export const deletePollOption = catchAsync(async (req, res) => {
  const pollService = new PollService(req.models, req.app.get("wss"));
  await pollService.deletePollOption(req.params.optionId, req.user.id);

  res.status(200).json({
    status: "success",
    message: "Option deleted successfully",
  });
});
