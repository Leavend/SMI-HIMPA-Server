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
      await Db.query("ALTER TABLE Users CHANGE user_id userId VARCHAR(255)");
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
