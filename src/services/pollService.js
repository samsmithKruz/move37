// src/services/pollService.js
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '../middlewares/errorHandler.js';
import {
  pollCreateSchema,
  pollUpdateSchema,
  pollOptionCreateSchema,
  pollOptionUpdateSchema,
  pollIdSchema,
  optionIdSchema,
  voteSchema,
  pollPaginationSchema
} from '../validations/pollValidation.js';

export class PollService {
  constructor(models, wss) {
    this.models = models;
    this.wss = wss;
  }

  /**
   * Validate data against Joi schema
   * @private
   */
  _validate(data, schema) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      throw new ValidationError(errorMessages.join(', '));
    }
    
    return value;
  }

  /**
   * Create a new poll with options
   */
  async createPoll(pollData, options = []) {
    // Validate poll data
    const validatedPollData = this._validate(pollData, pollCreateSchema);

    // Validate options
    if (!Array.isArray(options) || options.length < 2) {
      throw new ValidationError('At least two options are required');
    }

    options.forEach((option, index) => {
      this._validate(option, Joi.object({
        text: pollOptionCreateSchema.extract('text')
      }));
    });

    // Verify creator exists
    const creator = await this.models.User.find(validatedPollData.creatorId);
    if (!creator) {
      throw new NotFoundError('Creator user not found');
    }

    // Create poll with options
    const poll = await this.models.Poll.createWithOptions(
      validatedPollData,
      options.map(option => ({ text: option.text.trim() }))
    );

    return poll;
  }

  /**
   * Add a new option to an existing poll
   */
  async addPollOption(optionData) {
    const validatedData = this._validate(optionData, pollOptionCreateSchema);

    // Verify poll exists and user owns it
    const poll = await this.models.Poll.find(validatedData.pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    // Check if option already exists (case-insensitive)
    const existingOptions = await this.models.PollOption.getByPollId(validatedData.pollId);
    const optionExists = existingOptions.some(
      option => option.text.toLowerCase() === validatedData.text.toLowerCase()
    );

    if (optionExists) {
      throw new ConflictError('This option already exists for this poll');
    }

    const pollOption = await this.models.PollOption.create({
      text: validatedData.text.trim(),
      pollId: validatedData.pollId
    });

    return pollOption;
  }

  /**
   * Get poll option by ID
   */
  async getPollOption(optionId) {
    this._validate({ optionId }, Joi.object({ optionId: optionIdSchema }));

    const option = await this.models.PollOption.find(optionId);
    if (!option) {
      throw new NotFoundError('Poll option not found');
    }

    return option;
  }

  /**
   * Get all options for a poll
   */
  async getPollOptions(pollId) {
    this._validate({ pollId }, Joi.object({ pollId: pollIdSchema }));

    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    const options = await this.models.PollOption.getByPollId(pollId);
    return options;
  }

  /**
   * Update a poll option
   */
  async updatePollOption(optionId, updateData, userId) {
    this._validate({ optionId }, Joi.object({ optionId: optionIdSchema }));
    const validatedUpdateData = this._validate(updateData, pollOptionUpdateSchema);

    const option = await this.models.PollOption.findWithPoll(optionId);
    if (!option) {
      throw new NotFoundError('Poll option not found');
    }

    // Check if user owns the poll
    if (option.poll.creatorId !== userId) {
      throw new ForbiddenError('You can only update options of your own polls');
    }

    // Check if updated text conflicts with existing options
    const existingOptions = await this.models.PollOption.getByPollId(option.pollId);
    const optionExists = existingOptions.some(
      opt => opt.id !== optionId && opt.text.toLowerCase() === validatedUpdateData.text.toLowerCase()
    );

    if (optionExists) {
      throw new ConflictError('This option already exists for this poll');
    }

    const updatedOption = await this.models.PollOption.update(optionId, {
      text: validatedUpdateData.text.trim()
    });

    return updatedOption;
  }

  /**
   * Delete a poll option
   */
  async deletePollOption(optionId, userId) {
    this._validate({ optionId }, Joi.object({ optionId: optionIdSchema }));

    const option = await this.models.PollOption.findWithPoll(optionId);
    if (!option) {
      throw new NotFoundError('Poll option not found');
    }

    // Check if user owns the poll
    if (option.poll.creatorId !== userId) {
      throw new ForbiddenError('You can only delete options of your own polls');
    }

    // Prevent deleting options if poll has votes
    const voteCount = await this.models.Vote.countByOptionId(optionId);
    if (voteCount > 0) {
      throw new ConflictError('Cannot delete option that has votes');
    }

    // Ensure poll has at least 2 options remaining
    const remainingOptions = await this.models.PollOption.getByPollId(option.pollId);
    if (remainingOptions.length <= 2) {
      throw new ConflictError('Poll must have at least 2 options');
    }

    await this.models.PollOption.delete(optionId);
    return true;
  }

  /**
   * Get poll by ID with details
   */
  async getPollById(pollId, includeResults = false) {
    this._validate({ pollId }, Joi.object({ pollId: pollIdSchema }));

    const poll = await this.models.Poll.findWithDetails(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

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
   */
  async getPublishedPolls(options = {}) {
    const validatedOptions = this._validate(options, pollPaginationSchema);
    const { page, limit, creatorId } = validatedOptions;
    const skip = (page - 1) * limit;

    const where = { isPublished: true };
    if (creatorId) {
      where.creatorId = creatorId;
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
   */
  async getUserPolls(userId, options = {}) {
    this._validate({ userId }, Joi.object({ userId: Joi.string().required() }));
    const validatedOptions = this._validate(options, pollPaginationSchema);
    const { page, limit } = validatedOptions;
    const skip = (page - 1) * limit;

    const user = await this.models.User.find(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

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
   */
  async updatePoll(pollId, userId, updateData) {
    this._validate({ pollId }, Joi.object({ pollId: pollIdSchema }));
    const validatedUpdateData = this._validate(updateData, pollUpdateSchema);

    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    if (poll.creatorId !== userId) {
      throw new ForbiddenError('You can only update your own polls');
    }

    const updatedPoll = await this.models.Poll.update(pollId, validatedUpdateData);
    return updatedPoll;
  }

  /**
   * Delete a poll
   */
  async deletePoll(pollId, userId) {
    this._validate({ pollId }, Joi.object({ pollId: pollIdSchema }));

    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    if (poll.creatorId !== userId) {
      throw new ForbiddenError('You can only delete your own polls');
    }

    await this.models.Poll.delete(pollId);
    return true;
  }

  /**
   * Vote on a poll option
   */
  async voteOnPoll(pollId, optionId, userId) {
    this._validate({ pollId, optionId, userId }, voteSchema);

    const poll = await this.models.Poll.find(pollId);
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    if (!poll.isPublished) {
      throw new ForbiddenError('Cannot vote on unpublished poll');
    }

    const option = await this.models.PollOption.find(optionId);
    if (!option || option.pollId !== pollId) {
      throw new ValidationError('Invalid option for this poll');
    }

    const existingVote = await this.models.Vote.findByUserAndPoll(userId, pollId);
    if (existingVote) {
      throw new ConflictError('You have already voted on this poll');
    }

    const vote = await this.models.Vote.create({
      userId,
      pollOptionId: optionId,
      pollId
    });

    const results = await this.getPollResults(pollId);

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
   */
  async getPollResults(pollId) {
    this._validate({ pollId }, Joi.object({ pollId: pollIdSchema }));

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
   */
  async publishPoll(pollId, userId) {
    return this.updatePoll(pollId, userId, { isPublished: true });
  }

  /**
   * Unpublish a poll
   */
  async unpublishPoll(pollId, userId) {
    return this.updatePoll(pollId, userId, { isPublished: false });
  }

  /**
   * Check if user has voted on a poll
   */
  async hasUserVoted(pollId, userId) {
    this._validate({ pollId, userId }, Joi.object({
      pollId: pollIdSchema,
      userId: Joi.string().required()
    }));

    const userVotes = await this.models.Vote.getUserVotesForPoll(userId, pollId);
    return userVotes.length > 0;
  }

  /**
   * Get user's vote for a specific poll
   */
  async getUserVote(pollId, userId) {
    this._validate({ pollId, userId }, Joi.object({
      pollId: pollIdSchema,
      userId: Joi.string().required()
    }));

    const userVotes = await this.models.Vote.getUserVotesForPoll(userId, pollId);
    return userVotes.length > 0 ? userVotes[0] : null;
  }
}

export default PollService;