// src/validations/pollValidation.js
import Joi from 'joi';

export const pollCreateSchema = Joi.object({
  question: Joi.string()
    .min(3)
    .max(500)
    .trim()
    .required()
    .messages({
      'string.empty': 'Poll question is required',
      'string.min': 'Question must be at least 3 characters long',
      'string.max': 'Question cannot exceed 500 characters'
    }),
  isPublished: Joi.boolean().default(false),
  creatorId: Joi.string().required().messages({
    'string.empty': 'Creator ID is required'
  })
});

export const pollUpdateSchema = Joi.object({
  question: Joi.string()
    .min(3)
    .max(500)
    .trim()
    .optional()
    .messages({
      'string.min': 'Question must be at least 3 characters long',
      'string.max': 'Question cannot exceed 500 characters'
    }),
  isPublished: Joi.boolean().optional()
}).min(1);

export const pollOptionCreateSchema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.empty': 'Option text is required',
      'string.max': 'Option text cannot exceed 200 characters'
    }),
  pollId: Joi.string().required().messages({
    'string.empty': 'Poll ID is required'
  })
});

export const pollOptionUpdateSchema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.empty': 'Option text is required',
      'string.max': 'Option text cannot exceed 200 characters'
    })
});

export const pollIdSchema = Joi.string().required().messages({
  'string.empty': 'Poll ID is required'
});

export const optionIdSchema = Joi.string().required().messages({
  'string.empty': 'Option ID is required'
});

export const voteSchema = Joi.object({
  pollId: Joi.string().required().messages({
    'string.empty': 'Poll ID is required'
  }),
  optionId: Joi.string().required().messages({
    'string.empty': 'Option ID is required'
  }),
  userId: Joi.string().required().messages({
    'string.empty': 'User ID is required'
  })
});

export const pollPaginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  creatorId: Joi.string().optional()
});