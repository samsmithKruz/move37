// src/services/voteService.js
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../middlewares/errorHandler.js";

export class VoteService {
  constructor(models, wss) {
    this.models = models;
    this.wss = wss; // WebSocket server for real-time updates
  }

  /**
   * Cast a vote on a poll option
   * @param {string} pollId - Poll ID
   * @param {string} optionId - Poll option ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Vote result and updated poll results
   */
  async castVote(pollId, optionId, userId) {
    if (!pollId || !optionId || !userId) {
      throw new ValidationError("Poll ID, Option ID, and User ID are required");
    }

    // Verify poll exists and is published
    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    if (!poll.isPublished) {
      throw new ForbiddenError("Cannot vote on unpublished poll");
    }

    // Verify option belongs to poll
    const option = await this.models.PollOption.find(optionId);
    if (!option || option.pollId !== pollId) {
      throw new ValidationError("Invalid option for this poll");
    }

    // Check if user already voted on this poll
    const existingVote = await this.hasUserVotedOnPoll(pollId, userId);
    if (existingVote) {
      throw new ConflictError("You have already voted on this poll");
    }

    // Create vote
    const vote = await this.models.Vote.create({
      userId,
      pollOptionId: optionId,
    });

    // Get updated results
    const results = await this.getPollResults(pollId);

    // Broadcast real-time update to all clients watching this poll
    this.broadcastVoteUpdate(pollId, results, userId, optionId);

    return {
      vote: this._sanitizeVote(vote),
      results,
    };
  }

  /**
   * Get a user's vote for a specific poll
   * @param {string} pollId - Poll ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User's vote details
   */
  async getUserVoteForPoll(pollId, userId) {
    if (!pollId || !userId) {
      throw new ValidationError("Poll ID and User ID are required");
    }

    const userVotes = await this.models.Vote.getUserVotesForPoll(
      userId,
      pollId
    );

    if (userVotes.length === 0) {
      return null;
    }

    const vote = userVotes[0];
    return this._sanitizeVote(vote);
  }

  /**
   * Check if user has voted on a specific poll
   * @param {string} pollId - Poll ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user has voted
   */
  async hasUserVotedOnPoll(pollId, userId) {
    if (!pollId || !userId) {
      throw new ValidationError("Poll ID and User ID are required");
    }

    const userVotes = await this.models.Vote.getUserVotesForPoll(
      userId,
      pollId
    );
    return userVotes.length > 0;
  }

  /**
   * Get all votes for a specific poll
   * @param {string} pollId - Poll ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Votes and pagination info
   */
  async getVotesForPoll(pollId, options = {}) {
    if (!pollId) {
      throw new ValidationError("Poll ID is required");
    }

    // Verify poll exists
    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 50));
    const skip = (page - 1) * limit;

    // Get votes with user and option details
    const votes = await this.models.prisma.vote.findMany({
      where: {
        pollOption: {
          pollId: pollId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pollOption: {
          select: {
            id: true,
            text: true,
          },
        },
      },
      skip,
      take: limit,
    });

    const totalCount = await this.models.prisma.vote.count({
      where: {
        pollOption: {
          pollId: pollId,
        },
      },
    });

    const sanitizedVotes = votes.map((vote) => this._sanitizeVote(vote));

    return {
      votes: sanitizedVotes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get all votes for a specific poll option
   * @param {string} optionId - Poll option ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Votes and pagination info
   */
  async getVotesForOption(optionId, options = {}) {
    if (!optionId) {
      throw new ValidationError("Option ID is required");
    }

    // Verify option exists
    const option = await this.models.PollOption.find(optionId);
    if (!option) {
      throw new NotFoundError("Poll option not found");
    }

    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 50));
    const skip = (page - 1) * limit;

    const votes = await this.models.prisma.vote.findMany({
      where: { pollOptionId: optionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const totalCount = await this.models.prisma.vote.count({
      where: { pollOptionId: optionId },
    });

    const sanitizedVotes = votes.map((vote) => this._sanitizeVote(vote));

    return {
      votes: sanitizedVotes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get voting statistics for a poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<Object>} Voting statistics
   */
  async getVotingStatistics(pollId) {
    if (!pollId) {
      throw new ValidationError("Poll ID is required");
    }

    // Verify poll exists
    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    // Get total votes count
    const totalVotes = await this.models.prisma.vote.count({
      where: {
        pollOption: {
          pollId: pollId,
        },
      },
    });

    // Get votes per option
    const options = await this.models.prisma.pollOption.findMany({
      where: { pollId: pollId },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });

    const optionStats = options.map((option) => ({
      id: option.id,
      text: option.text,
      voteCount: option._count.votes,
      percentage:
        totalVotes > 0
          ? Math.round((option._count.votes / totalVotes) * 100)
          : 0,
    }));

    // Get votes over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const votesOverTime = await this.models.prisma.vote.groupBy({
      by: ["createdAt"],
      where: {
        pollOption: {
          pollId: pollId,
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      totalVotes,
      options: optionStats,
      votesOverTime: votesOverTime.map((item) => ({
        date: item.createdAt.toISOString().split("T")[0],
        count: item._count.id,
      })),
    };
  }

  /**
   * Retract a vote (if allowed by business rules)
   * @param {string} voteId - Vote ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async retractVote(voteId, userId) {
    if (!voteId || !userId) {
      throw new ValidationError("Vote ID and User ID are required");
    }

    const vote = await this.models.Vote.find(voteId);
    if (!vote) {
      throw new NotFoundError("Vote not found");
    }

    // Check if user owns the vote
    if (vote.userId !== userId) {
      throw new ForbiddenError("You can only retract your own votes");
    }

    // Business rule: Check if vote can be retracted (e.g., within time limit)
    const voteAge = Date.now() - new Date(vote.createdAt).getTime();
    const oneHour = 60 * 60 * 1000;

    if (voteAge > oneHour) {
      throw new ForbiddenError("Votes can only be retracted within 1 hour");
    }

    await this.models.Vote.delete(voteId);

    // Get updated results and broadcast
    const results = await this.getPollResults(vote.pollOption.pollId);
    this.broadcastVoteUpdate(
      vote.pollOption.pollId,
      results,
      userId,
      vote.pollOptionId
    );

    return true;
  }

  /**
   * Get poll results with vote counts
   * @param {string} pollId - Poll ID
   * @returns {Promise<Object>} Poll results
   */
  async getPollResults(pollId) {
    if (!pollId) {
      throw new ValidationError("Poll ID is required");
    }

    const poll = await this.models.Poll.findWithDetails(pollId);
    if (!poll) {
      throw new NotFoundError("Poll not found");
    }

    const results = poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      voteCount: option.votes.length,
    }));

    const totalVotes = results.reduce(
      (sum, option) => sum + option.voteCount,
      0
    );

    // Calculate percentages
    const resultsWithPercentages = results.map((option) => ({
      ...option,
      percentage:
        totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0,
    }));

    return {
      question: poll.question,
      totalVotes,
      results: resultsWithPercentages,
    };
  }

  /**
   * Broadcast vote update to WebSocket clients
   * @param {string} pollId - Poll ID
   * @param {Object} results - Updated results
   * @param {string} userId - User ID who voted
   * @param {string} optionId - Option ID that was voted on
   */
  broadcastVoteUpdate(pollId, results, userId, optionId) {
    if (this.wss && this.wss.broadcastToPoll) {
      this.wss.broadcastToPoll(pollId, {
        type: "vote_update",
        pollId,
        results,
        userId,
        optionId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Sanitize vote object by removing sensitive fields
   * @param {Object} vote - Vote object from database
   * @returns {Object} Sanitized vote object
   * @private
   */
  _sanitizeVote(vote) {
    if (!vote) return null;

    // Remove any sensitive user information if needed
    const sanitizedVote = { ...vote };

    if (sanitizedVote.user && sanitizedVote.user.email) {
      // Keep only necessary user info
      sanitizedVote.user = {
        id: sanitizedVote.user.id,
        name: sanitizedVote.user.name,
      };
    }

    return sanitizedVote;
  }
}

export default VoteService;
