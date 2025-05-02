import "reflect-metadata";
import { container } from "tsyringe";

// Register semua service dan datasource di sini
import BorrowService from "../service/borrow-service";
import BorrowDataSource from "../datasource/borrow-datasource";
import BorrowDetailService from "../service/borrowDetail-service";
import BorrowDetailDataSource from "../datasource/borrowDetail-datasource";

container.register("BorrowDataSource", { useClass: BorrowDataSource });
container.register("BorrowService", { useClass: BorrowService });
container.register("BorrowDetailDataSource", {
  useClass: BorrowDetailDataSource,
});
container.register("BorrowDetailService", { useClass: BorrowDetailService });

export default container;
