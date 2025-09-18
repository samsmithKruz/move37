// src/models/Poll.js
import { BaseModel } from './BaseModel.js';

export class Poll extends BaseModel {
  constructor() {
    super('poll');
  }

  // Custom poll methods
  async createWithOptions(pollData, options) {
    return this.model.create({
      data: {
        ...pollData,
        options: {
          create: options
        }
      },
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
    });
  }

  async findWithDetails(id) {
    return this.model.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            votes: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        votes: true
      }
    });
  }

  async listPublished() {
    return this.all(
      { isPublished: true },
      {
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
      }
    );
  }

  async getResults(pollId) {
    const poll = await this.findWithDetails(pollId);
    
    if (!poll) return null;
    
    const results = poll.options.map(option => ({
      id: option.id,
      text: option.text,
      votes: option.votes.length
    }));
    
    return {
      question: poll.question,
      totalVotes: poll.votes.length,
      results
    };
  }
}