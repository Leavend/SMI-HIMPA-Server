import "reflect-metadata";
import BorrowDetailService from "../service/borrowDetail-service"; // sesuaikan path
import container from "./container_borrow"; // container tsyringe-mu

(async () => {
  try {
    const borrowDetailService = container.resolve(BorrowDetailService);

    const borrowId = "01965e11-cefe-7017-97a2-d03bb2d26855"; // id yg sama seperti sebelumnya

    const borrowDetail = await borrowDetailService.getBorrowDetailsByField({
      borrowId,
    });

    if (borrowDetail) {
      console.log("✅ BorrowDetail ditemukan:");
      console.log(borrowDetail);
    } else {
      console.warn("⚠️ BorrowDetail tidak ditemukan.");
    }
  } catch (err) {
    console.error("❌ Error saat test getBorrowDetailByField:", err);
  }
})();
