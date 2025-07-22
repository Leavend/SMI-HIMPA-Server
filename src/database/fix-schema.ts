/**
 * Database schema fix script
 * Handles column name mismatches between model definitions and actual database tables
 */
import Db from "./index";
import logger from "../utils/logger";

/**
 * Fix database schema to match model definitions
 * This script handles cases where tables were created with different naming conventions
 */

const fixDatabaseSchema = async (): Promise<void> => {
  try {
    // Check if Users table exists and has the correct column names
    const [results] = await Db.query("DESCRIBE Users");
    const columns = results as any[];

    logger.info(
      "Current Users table columns:",
      columns.map((col) => col.Field),
    );

    // Check if userId column exists, if not, we need to rename user_id to userId
    const hasUserId = columns.some((col) => col.Field === "userId");
    const hasUserIdUnderscored = columns.some((col) => col.Field === "user_id");

    if (!hasUserId && hasUserIdUnderscored) {
      logger.info("Fixing Users table: renaming user_id to userId");
      
      // First, drop foreign key constraints that reference user_id
      try {
        await Db.query("ALTER TABLE Borrows DROP FOREIGN KEY Borrows_ibfk_1");
        logger.info("Dropped foreign key constraint Borrows_ibfk_1");
      } catch (error) {
        logger.warn("Could not drop foreign key constraint (might not exist):", error);
      }
      
      try {
        await Db.query("ALTER TABLE Returns DROP FOREIGN KEY Returns_ibfk_1");
        logger.info("Dropped foreign key constraint Returns_ibfk_1");
      } catch (error) {
        logger.warn("Could not drop foreign key constraint (might not exist):", error);
      }
      
      // Now rename the column
      await Db.query("ALTER TABLE Users CHANGE user_id userId VARCHAR(255)");
      
      // Re-add foreign key constraints with new column name
      try {
        await Db.query("ALTER TABLE Borrows ADD CONSTRAINT Borrows_ibfk_1 FOREIGN KEY (userId) REFERENCES Users(userId)");
        logger.info("Re-added foreign key constraint for Borrows table");
      } catch (error) {
        logger.warn("Could not re-add foreign key constraint for Borrows:", error);
      }
      
      try {
        await Db.query("ALTER TABLE Returns ADD CONSTRAINT Returns_ibfk_1 FOREIGN KEY (userId) REFERENCES Users(userId)");
        logger.info("Re-added foreign key constraint for Returns table");
      } catch (error) {
        logger.warn("Could not re-add foreign key constraint for Returns:", error);
      }
    }

    // Check other columns that might need renaming
    const columnMappings = [
      { old: "created_at", new: "createdAt" },
      { old: "updated_at", new: "updatedAt" },
    ];

    for (const mapping of columnMappings) {
      const hasOldColumn = columns.some((col) => col.Field === mapping.old);
      const hasNewColumn = columns.some((col) => col.Field === mapping.new);

      if (hasOldColumn && !hasNewColumn) {
        logger.info(
          `Fixing Users table: renaming ${mapping.old} to ${mapping.new}`,
        );
        await Db.query(
          `ALTER TABLE Users CHANGE ${mapping.old} ${mapping.new} DATETIME`,
        );
      }
    }

    logger.info("Database schema fix completed successfully");
  } catch (error) {
    logger.error("Error fixing database schema:", error);
    // Don't throw error, just log it
  }
};

export default fixDatabaseSchema;
