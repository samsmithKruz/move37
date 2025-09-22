// src/models/Vote.js
import { BaseModel } from "./BaseModel.js";

export class Vote extends BaseModel {
  constructor() {
    super("vote");
  }

  /**
   * Find vote by user and poll option
   * @param {string} userId - User ID
   * @param {string} pollOptionId - Poll Option ID
   * @returns {Promise<Object>} Vote record
   */
  async findByUserAndPollOption(userId, pollOptionId) {
    return this.first({
      userId,
      pollOptionId,
    });
  }

  /**
   * Get user's votes for a specific poll
   * @param {string} userId - User ID
   * @param {string} pollId - Poll ID
   * @returns {Promise<Array>} User's votes
   */
  async getUserVotesForPoll(userId, pollId) {
    return this.all(
      {
        userId,
        pollOption: {
          pollId,
        },
      },
      {
        include: {
          pollOption: true, // ✅ Correct structure
        },
      }
    );
  }

  /**
   * Find vote by user and poll (for checking if user already voted in a poll)
   * @param {string} userId - User ID
   * @param {string} pollId - Poll ID
   * @returns {Promise<Object>} Vote record
   */
  async findByUserAndPoll(userId, pollId) {
    return this.first(
      {
        userId,
        pollOption: {
          pollId,
        },
      },
      {
        include: {
          pollOption: true, // ✅ Correct structure
        },
      }
    );
  }

  /**
   * Count votes for a specific option
   * @param {string} optionId - Option ID
   * @returns {Promise<number>} Number of votes
   */
  async countByOptionId(optionId) {
    return this.count({
      pollOptionId: optionId,
    });
  }

  /**
   * Count votes for a specific poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<number>} Number of votes
   */
  async countByPollId(pollId) {
    return this.count({
      pollOption: {
        pollId,
      },
    });
  }

  /**
   * Delete all votes for a specific option
   * @param {string} optionId - Option ID
   * @returns {Promise<number>} Number of deleted votes
   */
  async deleteByOptionId(optionId) {
    const result = await this.model.deleteMany({
      where: { pollOptionId: optionId },
    });
    return result.count;
  }

  /**
   * Delete all votes for a specific poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<number>} Number of deleted votes
   */
  async deleteByPollId(pollId) {
    const result = await this.model.deleteMany({
      where: {
        pollOption: {
          pollId,
        },
      },
    });
    return result.count;
  }

  /**
   * Get vote statistics for a poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<Object>} Vote statistics
   */
  async getPollStats(pollId) {
    // This requires raw query or more advanced grouping
    // For now, we'll use the existing methods to build stats
    const votesByOption = await this.all(
      {
        pollOption: {
          pollId,
        },
      },
      {
        include: {
          pollOption: true,
        },
      }
    );

    const optionCounts = {};
    votesByOption.forEach((vote) => {
      const optionId = vote.pollOptionId;
      optionCounts[optionId] = (optionCounts[optionId] || 0) + 1;
    });

    const totalVotes = votesByOption.length;

    return {
      totalVotes,
      optionVotes: Object.entries(optionCounts).map(([optionId, count]) => ({
        optionId,
        count,
        percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
      })),
    };
  }
}
