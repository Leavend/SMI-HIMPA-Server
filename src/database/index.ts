import { Sequelize, Dialect } from "sequelize";
import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "local"
    ? ".env.local"
    : process.env.NODE_ENV === "development"
      ? ".env.dev"
      : ".env.local";
dotenv.config({ path: envFile });

const username = process.env.DB_USERNAME as string;
const password = process.env.DB_PASSWORD as string;
const database = process.env.DB_NAME as string;
const host = process.env.DB_HOST as string;
const dialect = (process.env.DB_TYPE as Dialect) ?? "mysql";
const port = parseInt(process.env.DB_PORT as string) ?? 3306;

const sequelize = new Sequelize(database, username, password, {
  host: host,
  dialect: dialect,
  port: port,
  logging: false,
});

export default sequelize;
