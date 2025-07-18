import { Sequelize, Dialect } from "sequelize";
import dotenv from "dotenv-safe";
import { APP_CONFIG } from "../config/app-config";

// Load environment variables
dotenv.config({ path: APP_CONFIG.envFilePath });

const {
  db: { host, port, username, password, database, dialect },
} = APP_CONFIG;

// Validate required database configuration
const validateDatabaseConfig = (): void => {
  const requiredFields = { host, username, password, database };
  const missingFields = Object.entries(requiredFields)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required database configuration: ${missingFields.join(", ")}`,
    );
  }
};

// Initialize database configuration
validateDatabaseConfig();

const sequelize = new Sequelize(database, username, password, {
  host,
  dialect: dialect as Dialect,
  port,
  logging: APP_CONFIG.db.logging,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
  },
});

export default sequelize;
