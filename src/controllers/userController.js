// src/controllers/userController.js
import { catchAsync } from "../middlewares/errorHandler.js";
import { UserService } from "../services/userService.js";
import { generateToken } from "../utils/helpers.js"; // moved jwt to its own utils file

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (sign up)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User created successfully with JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
export const createUser = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const user = await userService.createUser(req.body);
  const token = generateToken(user);

  res.status(201).json({
    status: "success",
    data: { ...user, token },
  });
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of users (requires JWT)
 */
export const getUsers = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const result = await userService.getAllUsers(req.query);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
export const getUser = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const user = await userService.getUserById(req.params.id);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

/**
 * @swagger
 * /users:
 *   put:
 *     summary: Update user information
 *     description: Update the details of an authenticated user (except password). Requires JWT authentication.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane.doe@example.com
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error (missing or invalid data)
 *       401:
 *         description: Unauthorized (JWT missing or invalid)
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already taken by another user
 */

export const updateUser = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const { name, email } = req.body;
  const data = {};
  name && (data.name = name);
  email && (data.email = email);
  console.log({data})
  const user = await userService.updateUser(req.user.id, data);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

/**
 * @swagger
 * /users/{id}/password:
 *   patch:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
export const changePassword = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  await userService.changePassword(
    req.params.id,
    req.body.currentPassword,
    req.body.newPassword
  );

  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login successful with JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
export const loginUser = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const user = await userService.verifyCredentials(
    req.body.email,
    req.body.password
  );

  if (!user) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid email or password",
    });
  }
  const token = generateToken(user);

  res.status(200).json({
    status: "success",
    data: { ...user, token },
  });
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
export const deleteUser = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  await userService.deleteUser(req.params.id);

  res.status(204).json({
    status: "success",
    message: "User deleted successfully",
  });
});

/**
 * @swagger
 * /users/{id}/polls:
 *   get:
 *     summary: Get a user with their polls
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
export const getUserWithPolls = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const user = await userService.getUserWithPolls(req.params.id);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

/**
 * @swagger
 * /users/{id}/votes:
 *   get:
 *     summary: Get a user with their votes
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
export const getUserWithVotes = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const user = await userService.getUserWithVotes(req.params.id);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
