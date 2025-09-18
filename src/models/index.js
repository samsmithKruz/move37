// src/models/index.js
import { User } from "./User.js";
import { Poll } from "./Poll.js";
import { PollOption } from "./PollOption.js";
import { Vote } from "./Vote.js";
import database from "../config/database.js";

// Get the singleton Prisma instance
const prisma = database.getClient();

// Initialize models
const models = {
  User: new User(),
  Poll: new Poll(),
  PollOption: new PollOption(),
  Vote: new Vote(),
  prisma,
  database, // Export the database singleton for direct access if needed
};

// Handle clean shutdown
process.on("beforeExit", async () => {
  await disconnectDatabase();
});

export default models;
