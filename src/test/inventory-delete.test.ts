import request from "supertest";
import app from "../app";
import { TestHelper } from "./test-helper";

describe("Inventory Delete API", () => {
  const testInventoryId = "01965283-a9ff-75df-abfd-2b2a1c1a277d";

  describe("DELETE /api/admin/inventory/:id", () => {
    it("should return error when trying to delete inventory with related borrow details", async () => {
      const res = await request(app)
        .delete(`/api/admin/inventory/${testInventoryId}`)
        .set(TestHelper.getAdminHeaders())
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toContain(
        "Cannot delete inventory because it has",
      );
      expect(res.body.message).toContain("related borrow detail(s)");
    });

    it("should delete inventory and related borrow details when cascade=true", async () => {
      const res = await request(app)
        .delete(`/api/admin/inventory/${testInventoryId}?cascade=true`)
        .set(TestHelper.getAdminHeaders())
        .expect(200);

      expect(res.body).toHaveProperty("status", true);
      expect(res.body.message).toContain(
        "Inventory item and related borrow details deleted successfully",
      );
    });

    it("should return 404 for non-existent inventory", async () => {
      const res = await request(app)
        .delete("/api/admin/inventory/non-existent-id")
        .set(TestHelper.getAdminHeaders())
        .expect(404);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("Inventory item not found");
    });

    it("should return 400 when non-admin user tries to delete inventory", async () => {
      const res = await request(app)
        .delete(`/api/admin/inventory/${testInventoryId}`)
        .set(TestHelper.getUserHeaders())
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("Admin access required");
    });

    it("should return 400 when no authorization header is provided", async () => {
      const res = await request(app)
        .delete(`/api/admin/inventory/${testInventoryId}`)
        .expect(400);

      expect(res.body).toHaveProperty("status", false);
      expect(res.body.message).toBe("Authorization header is required");
    });
  });
});
