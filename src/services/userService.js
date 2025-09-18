// src/services/userService.js
import bcrypt from "bcryptjs";
import Joi from "joi";
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from "../middlewares/errorHandler.js";
import {
  userCreateSchema,
  userUpdateSchema,
  changePasswordSchema,
  userIdSchema,
  emailSchema,
  paginationSchema,
} from "../validations/userValidation.js";

export class UserService {
  constructor(models) {
    this.models = models;
  }

  /**
   * Validate data against Joi schema
   * @private
   */
  _validate(data, schema) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      throw new ValidationError("Validation error", errorMessages);
    }

    return value;
  }

  /**
   * Create a new user with password hashing and proper validation
   */
  async createUser(userData) {
    // Validate input with Joi
    const validatedData = this._validate(userData, userCreateSchema);

    const { name, email, password } = validatedData;

    // Check if user already exists
    const existingUser = await this.models.User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password with appropriate cost factor
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.models.User.create({
      name,
      email,
      passwordHash,
    });

    return this._sanitizeUser(user);
  }

  /**
   * Get all users with pagination and validation
   */
  async getAllUsers(options = {}) {
    // Validate pagination options
    const validatedOptions = this._validate(options, paginationSchema);

    const { page, limit } = validatedOptions;
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      this.models.User.all(
        {},
        {
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }
      ),
      this.models.User.count(),
    ]);

    const sanitizedUsers = users.map((user) => this._sanitizeUser(user));

    return {
      users: sanitizedUsers,
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
   * Get user by ID with validation
   */
  async getUserById(userId) {
    // Validate UUID format
    this._validate({ userId }, Joi.object({ userId: userIdSchema }));

    const user = await this.models.User.find(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return this._sanitizeUser(user);
  }

  /**
   * Get user by email with validation
   */
  async getUserByEmail(email) {
    // Validate email format
    this._validate({ email }, Joi.object({ email: emailSchema }));

    const user = await this.models.User.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return this._sanitizeUser(user);
  }

  /**
   * Update user information with validation
   */
  async updateUser(userId, updateData) {
    // Validate user ID
    this._validate({ userId }, Joi.object({ userId: userIdSchema }));

    // Validate update data
    const validatedUpdateData = this._validate(updateData, userUpdateSchema);

    // Check if user exists
    const existingUser = await this.models.User.find(userId);
    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // If updating email, check if new email is already taken
    if (
      validatedUpdateData.email &&
      validatedUpdateData.email !== existingUser.email
    ) {
      const emailUser = await this.models.User.findByEmail(
        validatedUpdateData.email
      );
      if (emailUser && emailUser.id !== userId) {
        throw new ConflictError("Email already taken by another user");
      }
    }

    const updatedUser = await this.models.User.update(
      userId,
      validatedUpdateData
    );
    return this._sanitizeUser(updatedUser);
  }

  /**
   * Change user password with validation
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Validate user ID
    this._validate({ userId }, Joi.object({ userId: userIdSchema }));

    // Validate password data
    const passwordData = this._validate(
      { currentPassword, newPassword },
      changePasswordSchema
    );

    const user = await this.models.User.find(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      passwordData.currentPassword,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new ValidationError("Incorrect Password","Current password is incorrect");
    }

    // Prevent reusing the same password
    const isSamePassword = await bcrypt.compare(
      passwordData.newPassword,
      user.passwordHash
    );
    if (isSamePassword) {
      throw new ValidationError(
        "Password Duplicate",
        "New password cannot be the same as current password"
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(passwordData.newPassword, 12);

    await this.models.User.update(userId, { passwordHash: newPasswordHash });
    return true;
  }

  /**
   * Verify user credentials for login with validation
   */
  async verifyCredentials(email, password) {
    // Validate email format
    this._validate({ email }, Joi.object({ email: emailSchema }));

    if (!password) {
      throw new ValidationError("Password Error","Password is required");
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
   * Delete user account with validation
   */
  async deleteUser(userId) {
    // Validate user ID
    this._validate({ userId }, Joi.object({ userId: userIdSchema }));

    const user = await this.models.User.find(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    await this.models.User.delete(userId);
    return true;
  }

  /**
   * Get user with their polls with validation
   */
  async getUserWithPolls(userId) {
    // Validate user ID
    this._validate({ userId }, Joi.object({ userId: userIdSchema }));

    const user = await this.models.User.withPolls(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      ...this._sanitizeUser(user),
      polls: user.polls || [],
    };
  }

  /**
   * Get user with their votes with validation
   */
  async getUserWithVotes(userId) {
    // Validate user ID
    this._validate({ userId }, Joi.object({ userId: userIdSchema }));

    const user = await this.models.User.withVotes(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      ...this._sanitizeUser(user),
      votes: user.votes || [],
    };
  }

  /**
   * Sanitize user object by removing sensitive fields
   * @private
   */
  _sanitizeUser(user) {
    if (!user) return null;

    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export default UserService;
