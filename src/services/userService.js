// src/services/userService.js
import bcrypt from 'bcryptjs';
import { ValidationError, ConflictError, NotFoundError } from '../middlewares/errorHandler.js';

export class UserService {
  constructor(models) {
    this.models = models;
  }

  /**
   * Create a new user with password hashing
   * @param {Object} userData - User data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's plain text password
   * @returns {Promise<Object>} Created user without password hash
   */
  async createUser(userData) {
    const { name, email, password } = userData;

    // Validate input
    if (!name || !email || !password) {
      throw new ValidationError('Name, email, and password are required');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await this.models.User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.models.User.create({
      name,
      email,
      passwordHash
    });

    // Return user without password hash
    return this._sanitizeUser(user);
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Pagination options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Number of users per page (default: 50)
   * @returns {Promise<Object>} Users and pagination info
   */
  async getAllUsers(options = {}) {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 50));
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      this.models.User.all(
        {},
        {
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }
      ),
      this.models.User.count()
    ]);

    const sanitizedUsers = users.map(user => this._sanitizeUser(user));

    return {
      users: sanitizedUsers,
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
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.models.User.find(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this._sanitizeUser(user);
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} User data
   */
  async getUserByEmail(email) {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const user = await this.models.User.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this._sanitizeUser(user);
  }

  /**
   * Update user information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const existingUser = await this.models.User.find(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // If updating email, check if new email is already taken
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailUser = await this.models.User.findByEmail(updateData.email);
      if (emailUser && emailUser.id !== userId) {
        throw new ConflictError('Email already taken by another user');
      }
    }

    // Remove password from update data (use changePassword for that)
    const { password, ...safeUpdateData } = updateData;

    const updatedUser = await this.models.User.update(userId, safeUpdateData);
    return this._sanitizeUser(updatedUser);
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (!userId || !currentPassword || !newPassword) {
      throw new ValidationError('User ID, current password, and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters long');
    }

    const user = await this.models.User.find(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.models.User.update(userId, { passwordHash: newPasswordHash });

    return true;
  }

  /**
   * Verify user credentials for login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data if credentials are valid
   */
  async verifyCredentials(email, password) {
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await this.models.User.findByEmail(email);
    if (!user) {
      // Return null instead of throwing error to prevent email enumeration
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return this._sanitizeUser(user);
  }

  /**
   * Delete user account
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    // Check if user exists
    const user = await this.models.User.find(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.models.User.delete(userId);
    return true;
  }

  /**
   * Get user with their polls
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User with polls
   */
  async getUserWithPolls(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.models.User.withPolls(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...this._sanitizeUser(user),
      polls: user.polls || []
    };
  }

  /**
   * Get user with their votes
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User with votes
   */
  async getUserWithVotes(userId) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const user = await this.models.User.withVotes(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...this._sanitizeUser(user),
      votes: user.votes || []
    };
  }

  /**
   * Sanitize user object by removing sensitive fields
   * @param {Object} user - User object from database
   * @returns {Object} Sanitized user object
   * @private
   */
  _sanitizeUser(user) {
    if (!user) return null;

    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export default UserService;