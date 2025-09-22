// src/models/PollOption.js
import { BaseModel } from "./BaseModel.js";

export class PollOption extends BaseModel {
  constructor() {
    super("pollOption");
  }

  /**
   * Get poll option with poll details
   * @param {string} optionId - Option ID
   * @returns {Promise<Object>} Option with poll data
   */
  async findWithPoll(optionId) {
    return this.model.findUnique({
      where: { id: optionId },
      include: {
        poll: true,
      },
    });
  }

  /**
   * Get all options for a specific poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<Array>} Array of poll options
   */
  async getByPollId(pollId) {
    return this.model.findMany({
      where: { pollId },
    });
  }

  /**
   * Get options with vote counts for a poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<Array>} Options with vote counts
   */
  async getWithVoteCounts(pollId) {
    return this.model.findMany({
      where: { pollId },
      include: {
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Get poll option with votes and poll details
   * @param {string} optionId - Option ID
   * @returns {Promise<Object>} Option with votes and poll
   */
  async withVotes(optionId) {
    return this.model.findUnique({
      where: { id: optionId },
      include: {
        votes: true,
        poll: true,
      },
    });
  }

  /**
   * Get vote count for a specific option
   * @param {string} optionId - Option ID
   * @returns {Promise<number>} Number of votes
   */
  async getVoteCount(optionId) {
    const option = await this.withVotes(optionId);
    return option ? option.votes.length : 0;
  }

  /**
   * Count options for a specific poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<number>} Number of options
   */
  async countByPollId(pollId) {
    return this.model.count({
      where: { pollId },
    });
  }

  /**
   * Check if option with text already exists in poll (case-insensitive)
   * @param {string} pollId - Poll ID
   * @param {string} text - Option text
   * @param {string} [excludeOptionId] - Option ID to exclude from check
   * @returns {Promise<boolean>} Whether option exists
   */
  async optionExists(pollId, text, excludeOptionId = null) {
    const options = await this.model.findMany({
      where: { pollId },
    });

    return options.some((option) => {
      if (excludeOptionId && option.id === excludeOptionId) return false;
      return option.text.toLowerCase() === text.toLowerCase();
    });
  }

  /**
   * Create multiple options at once
   * @param {Array} optionsData - Array of option data
   * @returns {Promise<Array>} Created options
   */
  async createMany(optionsData) {
    return this.model.createMany({
      data: optionsData,
      skipDuplicates: true,
    });
  }

  /**
   * Delete all options for a specific poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<number>} Number of deleted options
   */
  async deleteByPollId(pollId) {
    const result = await this.model.deleteMany({
      where: { pollId },
    });
    return result.count;
  }

  /**
   * Get option with detailed information including vote percentages
   * @param {string} optionId - Option ID
   * @returns {Promise<Object>} Option with detailed stats
   */
  async getWithStats(optionId) {
    const option = await this.model.findUnique({
      where: { id: optionId },
      include: {
        votes: true,
        poll: {
          include: {
            options: {
              include: {
                _count: {
                  select: { votes: true },
                },
              },
            },
          },
        },
      },
    });

    if (!option) return null;

    const totalVotes = option.poll.options.reduce(
      (sum, opt) => sum + opt._count.votes,
      0
    );
    const voteCount = option.votes.length;
    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

    return {
      ...option,
      voteCount,
      percentage: Math.round(percentage),
      totalVotes,
    };
  }

  /**
   * Update multiple options at once
   * @param {Array} updates - Array of update objects with id and data
   * @returns {Promise<Array>} Updated options
   */
  async updateMany(updates) {
    const transaction = updates.map((update) =>
      this.model.update({
        where: { id: update.id },
        data: update.data,
      })
    );

    return database.getClient().$transaction(transaction);
  }

  /**
   * Search options within a poll
   * @param {string} pollId - Poll ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching options
   */
  async searchInPoll(pollId, searchTerm) {
    return this.model.findMany({
      where: {
        pollId,
        text: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}
