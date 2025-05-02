import "reflect-metadata"; // wajib kalau pakai tsyringe
import BorrowService from "../service/borrow-service"; // sesuaikan path-nya
import container from "./container_borrow"; // ini container tempat tsyringe register dependency

(async () => {
  try {
    const borrowService = container.resolve(BorrowService);

    const borrowId = "01965e11-cefe-7017-97a2-d03bb2d26855"; // ID yang kamu mau test

    const borrow = await borrowService.getBorrowByField({ borrowId });

    if (borrow) {
      console.log("✅ Borrow ditemukan:");
      console.log(borrow);
    } else {
      console.warn("⚠️ Borrow tidak ditemukan.");
    }
  } catch (err) {
    console.error("❌ Error saat test getBorrowByField:", err);
  }
})();
