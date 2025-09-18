// src/models/Vote.js
import { BaseModel } from './BaseModel.js';

export class Vote extends BaseModel {
  constructor() {
    super('vote');
  }

  // Custom vote methods
  async findByUserAndPollOption(userId, pollOptionId) {
    return this.first({
      userId,
      pollOptionId
    });
  }

  async getUserVotesForPoll(userId, pollId) {
    return this.all({
      userId,
      pollOption: {
        pollId
      }
    }, {
      include: {
        pollOption: true
      }
    });
  }
}