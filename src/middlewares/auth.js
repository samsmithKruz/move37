import { verifyToken } from "../utils/helpers.js";
import { UnauthorizedError } from "./errorHandler.js";

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new UnauthorizedError('Not authorized, token missing');
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    throw new UnauthorizedError('Not authorized, invalid token');
  }
};