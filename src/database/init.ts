import UserModel from "../model/user-model";
import BorrowModel from "../model/borrow-model";
import InventoryModel from "../model/inventory-model";
import TokenModel from "../model/token-model";
import BorrowDetailModel from "../model/borrowDetail-model";
import ReturnModel from "../model/return-model";
import Db from "./index";

const models = [
  UserModel,
  BorrowModel,
  InventoryModel,
  TokenModel,
  BorrowDetailModel,
  ReturnModel,
];

const DbInitialize = async () => {
  try {
    await Db.authenticate();
    for (const model of models) {
      await model.sync({ alter: false });
    }
    console.log(
      "Connection to the database has been established successfully.",
    );
  } catch (e) {
    console.error("Error while connecting to the database", e);
  }
};

export default DbInitialize;
