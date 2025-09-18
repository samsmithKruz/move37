// src/services/pollService.js
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from '../middlewares/errorHandler.js';

export class PollService {
  constructor(models, wss) {
    this.models = models;
    this.wss = wss; // WebSocket server for real-time updates
  }

  /**
   * Create a new poll with options
   * @param {Object} pollData - Poll data
   * @param {string} pollData.question - Poll question
   * @param {string} pollData.creatorId - User ID of the creator
   * @param {boolean} pollData.isPublished - Whether the poll is published
   * @param {Array} options - Array of poll option texts
   * @returns {Promise<Object>} Created poll with options
   */
  async createPoll(pollData, options = []) {
    const { question, creatorId, isPublished = false } = pollData;

    // Validate input
    if (!question || !creatorId) {
      throw new ValidationError('Question and creator ID are required');
    }

    if (question.length < 3) {
      throw new ValidationError('Question must be at least 3 characters long');
    }

    if (!Array.isArray(options) || options.length < 2) {
      throw new ValidationError('At least two options are required');
    }

    if (options.some(option => !option.text || option.text.trim().length === 0)) {
      throw new ValidationError('All options must have text');
    }

    // Verify creator exists
    const creator = await this.models.User.find(creatorId);
    if (!creator) {
      throw new NotFoundError('Creator user not found');
    }

    // Create poll with options
    const poll = await this.models.Poll.createWithOptions(
      { question, creatorId, isPublished },
      options.map(option => ({ text: option.text.trim() }))
    );

    return poll;
  }

  /**
   * Get poll by ID with details
   * @param {string} pollId - Poll ID
   * @param {boolean} includeResults - Whether to include vote results
   * @returns {Promise<Object>} Poll data with options and results
   */
  async getPollById(pollId, includeResults = false) {
    if (!pollId) {
      throw new ValidationError('Poll ID is required');
    }

    const poll = await this.models.Poll.findWithDetails(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // Don't return unpublished polls unless requested by owner
    if (!poll.isPublished) {
      throw new ForbiddenError('This poll is not published');
    }

    if (includeResults) {
      const results = await this.getPollResults(pollId);
      return { ...poll, results };
    }

    return poll;
  }

  /**
   * Get all published polls with pagination
   * @param {Object} options - Pagination and filtering options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.creatorId - Filter by creator ID
   * @returns {Promise<Object>} Polls and pagination info
   */
  async getPublishedPolls(options = {}) {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where = { isPublished: true };
    if (options.creatorId) {
      where.creatorId = options.creatorId;
    }

    const [polls, totalCount] = await Promise.all([
      this.models.Poll.all(where, {
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          options: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      this.models.Poll.count(where)
    ]);

    return {
      polls,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get polls created by a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} User's polls
   */
  async getUserPolls(userId, options = {}) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.models.User.find(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
    const skip = (page - 1) * limit;

    const [polls, totalCount] = await Promise.all([
      this.models.Poll.all(
        { creatorId: userId },
        {
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            options: {
              include: {
                votes: true
              }
            }
          }
        }
      ),
      this.models.Poll.count({ creatorId: userId })
    ]);

    // Add vote counts to each option
    const pollsWithResults = polls.map(poll => ({
      ...poll,
      options: poll.options.map(option => ({
        ...option,
        voteCount: option.votes.length
      })),
      totalVotes: poll.options.reduce((sum, option) => sum + option.votes.length, 0)
    }));

    return {
      polls: pollsWithResults,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Update a poll
   * @param {string} pollId - Poll ID
   * @param {string} userId - User ID of the requester
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated poll
   */
  async updatePoll(pollId, userId, updateData) {
    if (!pollId || !userId) {
      throw new ValidationError('Poll ID and User ID are required');
    }

    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // Check if user owns the poll
    if (poll.creatorId !== userId) {
      throw new ForbiddenError('You can only update your own polls');
    }

    const updatedPoll = await this.models.Poll.update(pollId, updateData);
    return updatedPoll;
  }

  /**
   * Delete a poll
   * @param {string} pollId - Poll ID
   * @param {string} userId - User ID of the requester
   * @returns {Promise<boolean>} Success status
   */
  async deletePoll(pollId, userId) {
    if (!pollId || !userId) {
      throw new ValidationError('Poll ID and User ID are required');
    }

    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // Check if user owns the poll
    if (poll.creatorId !== userId) {
      throw new ForbiddenError('You can only delete your own polls');
    }

    await this.models.Poll.delete(pollId);
    return true;
  }

  /**
   * Vote on a poll option
   * @param {string} pollId - Poll ID
   * @param {string} optionId - Poll option ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Vote result and updated poll results
   */
  async voteOnPoll(pollId, optionId, userId) {
    if (!pollId || !optionId || !userId) {
      throw new ValidationError('Poll ID, Option ID, and User ID are required');
    }

    // Verify poll exists and is published
    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    if (!poll.isPublished) {
      throw new ForbiddenError('Cannot vote on unpublished poll');
    }

    // Verify option belongs to poll
    const option = await this.models.PollOption.find(optionId);
    if (!option || option.pollId !== pollId) {
      throw new ValidationError('Invalid option for this poll');
    }

    // Check if user already voted on this poll
    const existingVote = await this.models.Vote.findByUserAndPollOption(userId, optionId);
    if (existingVote) {
      throw new ConflictError('You have already voted on this poll');
    }

    // Create vote
    const vote = await this.models.Vote.create({
      userId,
      pollOptionId: optionId
    });

    // Get updated results
    const results = await this.getPollResults(pollId);

    // Broadcast real-time update to all clients watching this poll
    if (this.wss && this.wss.broadcastToPoll) {
      this.wss.broadcastToPoll(pollId, {
        type: 'vote_cast',
        pollId,
        results,
        timestamp: new Date().toISOString()
      });
    }

    return {
      vote,
      results
    };
  }

  /**
   * Get poll results with vote counts
   * @param {string} pollId - Poll ID
   * @returns {Promise<Object>} Poll results
   */
  async getPollResults(pollId) {
    if (!pollId) {
      throw new ValidationError('Poll ID is required');
    }

    const poll = await this.models.Poll.findWithDetails(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    const results = poll.options.map(option => ({
      id: option.id,
      text: option.text,
      voteCount: option.votes.length
    }));

    const totalVotes = results.reduce((sum, option) => sum + option.voteCount, 0);

    // Calculate percentages
    const resultsWithPercentages = results.map(option => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0
    }));

    return {
      question: poll.question,
      totalVotes,
      results: resultsWithPercentages
    };
  }

  /**
   * Publish a poll
   * @param {string} pollId - Poll ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Published poll
   */
  async publishPoll(pollId, userId) {
    return this.updatePoll(pollId, userId, { isPublished: true });
  }

  /**
   * Unpublish a poll
   * @param {string} pollId - Poll ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Unpublished poll
   */
  async unpublishPoll(pollId, userId) {
    return this.updatePoll(pollId, userId, { isPublished: false });
  }

  /**
   * Check if user has voted on a poll
   * @param {string} pollId - Poll ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user has voted
   */
  async hasUserVoted(pollId, userId) {
    if (!pollId || !userId) {
      throw new ValidationError('Poll ID and User ID are required');
    }

    const userVotes = await this.models.Vote.getUserVotesForPoll(userId, pollId);
    return userVotes.length > 0;
  }

  /**
   * Get user's vote for a specific poll
   * @param {string} pollId - Poll ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User's vote
   */
  async getUserVote(pollId, userId) {
    if (!pollId || !userId) {
      throw new ValidationError('Poll ID and User ID are required');
    }

    const userVotes = await this.models.Vote.getUserVotesForPoll(userId, pollId);
    return userVotes.length > 0 ? userVotes[0] : null;
  }
}

export default PollService;