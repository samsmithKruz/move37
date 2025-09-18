// src/models/PollOption.js
import { BaseModel } from './BaseModel.js';

export class PollOption extends BaseModel {
  constructor() {
    super('pollOption');
  }

  // Custom poll option methods
  async withVotes(optionId) {
    return this.model.findUnique({
      where: { id: optionId },
      include: {
        votes: true,
        poll: true
      }
    });
  }

  async getVoteCount(optionId) {
    const option = await this.withVotes(optionId);
    return option ? option.votes.length : 0;
  }
}