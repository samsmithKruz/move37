// src/models/BaseModel.js
import database from '../config/database.js';

export class BaseModel {
  constructor(modelName) {
    this.model = database.getClient()[modelName];
    this.modelName = modelName;
  }

  // Find all records with optional filtering and pagination
  async all(where = {}, options = {}) {
    const {
      skip = 0,
      take = 50,
      orderBy = { createdAt: 'desc' },
      include = undefined
    } = options;

    return this.model.findMany({
      where,
      skip,
      take,
      orderBy,
      include
    });
  }

  // Find a record by ID
  async find(id, include = undefined) {
    return this.model.findUnique({
      where: { id },
      include
    });
  }

  // Create a new record
  async create(data) {
    return this.model.create({
      data
    });
  }

  // Update a record
  async update(id, data) {
    return this.model.update({
      where: { id },
      data
    });
  }

  // Delete a record
  async delete(id) {
    return this.model.delete({
      where: { id }
    });
  }

  // Find first record matching criteria
  async first(where = {}, include = {}) {
    return this.model.findFirst({
      where,
      ...include
    });
  }

  // Count records matching criteria
  async count(where = {}) {
    return this.model.count({
      where
    });
  }

  // Check if a record exists
  async exists(where = {}) {
    const count = await this.count(where);
    return count > 0;
  }

  // Find or create a record
  async findOrCreate(where, createData) {
    const existing = await this.first(where);
    if (existing) return existing;
    
    return this.create(createData);
  }

  // Update or create a record
  async updateOrCreate(where, data) {
    const existing = await this.first(where);
    if (existing) {
      return this.update(existing.id, data);
    }
    
    return this.create({ ...where, ...data });
  }
}