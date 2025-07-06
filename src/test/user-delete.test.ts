import request from "supertest";
import app from "../app";
import { TestHelper } from "./test-helper";

describe("User Delete API", () => {
  const testUserId = "test-user-id-for-deletion";

  describe("DELETE /api/admin/user/:id", () => {
    it("should return error when trying to delete user with related borrow records", async () => {
      const res = await request(app)
        .delete(`/api/admin/user/${testUserId}`)
        .set(TestHelper.getAdminHeaders())
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toContain(
        "Cannot delete user because they have",
      );
      expect(res.body.message).toContain("related borrow record(s)");
    });

    it("should delete user and related borrow records when cascade=true", async () => {
      const res = await request(app)
        .delete(`/api/admin/user/${testUserId}?cascade=true`)
        .set(TestHelper.getAdminHeaders())
        .expect(200);

      expect(res.body).toHaveProperty("status", true);
      expect(res.body.message).toContain(
        "User and related borrow records deleted successfully",
      );
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .delete("/api/admin/user/non-existent-id")
        .set(TestHelper.getAdminHeaders())
        .expect(404);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("User not found");
    });

    it("should return 400 when non-admin user tries to delete user", async () => {
      const res = await request(app)
        .delete(`/api/admin/user/${testUserId}`)
        .set(TestHelper.getUserHeaders())
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("Admin access required");
    });

    it("should return 400 when no authorization header is provided", async () => {
      const res = await request(app)
        .delete(`/api/admin/user/${testUserId}`)
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("Authorization header is required");
    });

    it("should return 400 when user ID is missing", async () => {
      const res = await request(app)
        .delete("/api/admin/user/")
        .set(TestHelper.getAdminHeaders())
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("User ID is required");
    });
  });
}); 