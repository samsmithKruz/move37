// src/config/database.js
import { PrismaClient } from '@prisma/client';

/**
 * Singleton class for Prisma database connection
 * Ensures only one instance of PrismaClient exists across the application
 */
class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error']
    });
    
    Database.instance = this;
  }

  /**
   * Get the Prisma client instance
   * @returns {PrismaClient} Prisma client instance
   */
  getClient() {
    return this.prisma;
  }

  /**
   * Health check for database connection
   * @returns {Promise<{success: boolean, error?: string}>} Connection status
   */
  async checkConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Gracefully disconnect from the database
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      await this.prisma.$disconnect();
      console.log('✅ Database connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing database connection:', error.message);
      throw error;
    }
  }

  /**
   * Execute a database transaction
   * @param {Function} callback Transaction callback function
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    return this.prisma.$transaction(callback);
  }

  /**
   * Execute a raw SQL query
   * @param {TemplateStringsArray} strings SQL query strings
   * @param {...any} values Query values
   * @returns {Promise<any>} Query result
   */
  async rawQuery(strings, ...values) {
    return this.prisma.$queryRaw(strings, ...values);
  }
}

// Create singleton instance
const database = new Database();
Object.freeze(database); // Prevent modification

export default database;