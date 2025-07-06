import request from "supertest";
import app from "../app";
import { TestHelper } from "./test-helper";

describe("Borrow Delete API", () => {
  const testBorrowId = "01973e16-1a75-75c2-ad0b-81a6981ed9ee";

  describe("DELETE /api/admin/borrow/:id", () => {
    it("should return error when trying to delete borrow with related borrow details", async () => {
      const res = await request(app)
        .delete(`/api/admin/borrow/${testBorrowId}`)
        .set(TestHelper.getAdminHeaders())
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toContain(
        "Cannot delete borrow because it has",
      );
      expect(res.body.message).toContain("related borrow detail(s)");
    });

    it("should delete borrow and related borrow details when cascade=true", async () => {
      const res = await request(app)
        .delete(`/api/admin/borrow/${testBorrowId}?cascade=true`)
        .set(TestHelper.getAdminHeaders())
        .expect(200);

      expect(res.body).toHaveProperty("status", true);
      expect(res.body.message).toContain(
        "Borrow record and related borrow details deleted successfully",
      );
    });

    it("should return 404 for non-existent borrow", async () => {
      const res = await request(app)
        .delete("/api/admin/borrow/non-existent-id")
        .set(TestHelper.getAdminHeaders())
        .expect(404);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("Borrow record not found");
    });

    it("should return 400 when non-admin user tries to delete borrow", async () => {
      const res = await request(app)
        .delete(`/api/admin/borrow/${testBorrowId}`)
        .set(TestHelper.getUserHeaders())
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("Admin access required");
    });

    it("should return 400 when no authorization header is provided", async () => {
      const res = await request(app)
        .delete(`/api/admin/borrow/${testBorrowId}`)
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("Authorization header is required");
    });
  });
}); 