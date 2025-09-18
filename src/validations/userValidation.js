// src/validations/userValidation.js
import Joi from "joi";

export const userCreateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      "string.pattern.base": "Name can only contain letters and spaces",
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
    }),

  email: Joi.string().email().normalize().max(255).required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "string.max": "Email cannot exceed 255 characters",
  }),

  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password cannot exceed 100 characters",
      "string.empty": "Password is required",
    }),
});

export const userUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .pattern(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      "string.pattern.base": "Name can only contain letters and spaces",
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
    }),

  email: Joi.string().email().normalize().max(255).optional().messages({
    "string.email": "Please provide a valid email address",
    "string.max": "Email cannot exceed 255 characters",
  }),
}).min(1); // At least one field required

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
  }),
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password cannot exceed 100 characters",
      "string.empty": "Password is required",
    }),
});

export const userIdSchema = Joi.string().required().messages({
  "string.empty": "User ID is required",
});

export const emailSchema = Joi.string()
  .email()
  .normalize()
  .max(255)
  .required()
  .messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
  });

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.min": "Page must be at least 1",
    "number.integer": "Page must be an integer",
  }),
  limit: Joi.number().integer().min(1).max(100).default(50).messages({
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
    "number.integer": "Limit must be an integer",
  }),
});
