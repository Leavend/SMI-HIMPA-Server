import { container } from "tsyringe";
import BorrowModel from "./model/borrow-model";
import BorrowDetailModel from "./model/borrowDetail-model";
import InventoryModel from "./model/inventory-model";
import UserModel from "./model/user-model";
import ReturnModel from "./model/return-model";

container.register("BorrowModel", { useValue: BorrowModel });
container.register("BorrowDetailModel", { useValue: BorrowDetailModel });
container.register("InventoryModel", { useValue: InventoryModel });
container.register("UserModel", { useValue: UserModel });

container.register('ReturnModel', { useValue: ReturnModel });
container.register('BorrowModel', { useValue: BorrowModel });
container.register('BorrowDetailModel', { useValue: BorrowDetailModel });
container.register('InventoryModel', { useValue: InventoryModel });
container.register('UserModel', { useValue: UserModel });
