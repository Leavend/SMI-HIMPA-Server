import { Sequelize, Dialect } from "sequelize";
import dotenv from "dotenv-safe";

// const envFile =
//   process.env.NODE_ENV === "development" ? ".env.dev" : ".env.local";
// dotenv.config({ path: envFile });

dotenv.config({ path: ".env" })

const username = process.env.DB_USERNAME!;
const password = process.env.DB_PASSWORD!;
const database = process.env.DB_NAME!;
const host = process.env.DB_HOST!;
const dialect = (process.env.DB_TYPE as Dialect) ?? "mysql";
const port = parseInt(process.env.DB_PORT ?? "3306");

const sequelize = new Sequelize(database, username, password, {
  host,
  dialect,
  port,
  logging: false,
});

export default sequelize;
