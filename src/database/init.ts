/**
 * Database initialization module
 * Handles database connection and model synchronization
 */
import UserModel from "../model/user-model";
import BorrowModel from "../model/borrow-model";
import InventoryModel from "../model/inventory-model";
import TokenModel from "../model/token-model";
import BorrowDetailModel from "../model/borrowDetail-model";
import ReturnModel from "../model/return-model";
import Db from "./index";
import "../model/associations";
import logger from "../utils/logger";
import fixDatabaseSchema from "./fix-schema";

const models = [
  UserModel,
  BorrowModel,
  InventoryModel,
  TokenModel,
  BorrowDetailModel,
  ReturnModel,
];

/**
 * Initialize database connection and sync models
 * @returns Promise<void>
 */
const DbInitialize = async (): Promise<void> => {
  try {
    await Db.authenticate();

    // Fix database schema if needed
    await fixDatabaseSchema();

    for (const model of models) {
      await model.sync({ alter: false });
    }

    logger.info(
      "Connection to the database has been established successfully.",
    );
  } catch (error) {
    logger.error("Error while connecting to the database:", error);
    throw error;
  }
};

export default DbInitialize;
