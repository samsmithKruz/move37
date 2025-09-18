// src/controllers/userController.js
import { catchAsync } from "../middlewares/errorHandler.js";
import { UserService } from "../services/userService.js";
import { generateToken } from "../utils/helpers.js";

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
 *     summary: Create a new user (Sign up)
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
 *         description: User created successfully
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
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User with this email already exists
 */
export const createUser = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const user = await userService.createUser(req.body);
  const token = generateToken(user);

  res.status(201).json({
    status: "success",
    data: { user, token },
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
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
 * /users/{id}:
 *   put:
 *     summary: Update user information
 *     description: Update user details (name, email). Cannot update password through this endpoint.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Cannot update other users
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Email already taken by another user
 */
export const updateUser = catchAsync(async (req, res) => {
  //   // Check if user is updating their own profile
  //   if (req.user.id !== req.params.id) {
  //     return res.status(403).json({
  //       status: "fail",
  //       message: "You can only update your own profile"
  //     });
  //   }

  const userService = new UserService(req.models);
  const { name, email } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;

  const user = await userService.updateUser(req.params.id, updateData);

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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Cannot change other users' passwords
 */
export const changePassword = catchAsync(async (req, res) => {
  //   // Check if user is changing their own password
  //   if (req.user.id !== req.params.id) {
  //     return res.status(403).json({
  //       status: "fail",
  //       message: "You can only change your own password"
  //     });
  //   }

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
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login successful
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
 *       401:
 *         description: Invalid email or password
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
    data: { user, token },
  });
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         $ref: '#/components/responses/ApiResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Cannot delete other users
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const deleteUser = catchAsync(async (req, res) => {
  //   // Check if user is deleting their own account
  //   if (req.user.id !== req.params.id) {
  //     return res.status(403).json({
  //       status: "fail",
  //       message: "You can only delete your own account"
  //     });
  //   }

  const userService = new UserService(req.models);
  await userService.deleteUser(req.params.id);

  return res.status(200).json({
    status: "success",
    message: "User deleted successfully",
  });
});

/**
 * @swagger
 * /users/{id}/polls:
 *   get:
 *     summary: Get a user with their created polls
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User with polls retrieved successfully
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
 *                       allOf:
 *                         - $ref: '#/components/schemas/User'
 *                         - type: object
 *                           properties:
 *                             polls:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Poll'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
 *     summary: Get a user with their voting history
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User with votes retrieved successfully
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
 *                       allOf:
 *                         - $ref: '#/components/schemas/User'
 *                         - type: object
 *                           properties:
 *                             votes:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Vote'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
export const getUserWithVotes = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const user = await userService.getUserWithVotes(req.params.id);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export const getCurrentUser = catchAsync(async (req, res) => {
  const userService = new UserService(req.models);
  const user = await userService.getUserById(req.user.id);

  res.status(200).json({
    status: "success",
    data: { user },
  });
});
