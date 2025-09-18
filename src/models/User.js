// src/models/User.js
import { BaseModel } from './BaseModel.js';

export class User extends BaseModel {
  constructor() {
    super('user');
  }

  // Custom user methods
  async findByEmail(email) {
    return this.first({ email });
  }

  async withPolls(userId) {
    return this.model.findUnique({
      where: { id: userId },
      include: {
        polls: {
          include: {
            options: true
          }
        }
      }
    });
  }

  async withVotes(userId) {
    return this.model.findUnique({
      where: { id: userId },
      include: {
        votes: {
          include: {
            pollOption: {
              include: {
                poll: true
              }
            }
          }
        }
      }
    });
  }
}