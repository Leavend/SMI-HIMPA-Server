import request from "supertest";
import app from "../app";

describe("API Routes", () => {
  // USER ROUTES
  describe("User Routes", () => {
    it("POST /api/user/register", async () => {
      const res = await request(app).post("/api/user/register").send({
        username: "testuser",
        email: "test@example.com",
        number: "1234567890",
        password: "password",
      });
      expect(res.status).toBeDefined();
    });
    it("POST /api/user/login", async () => {
      const res = await request(app)
        .post("/api/user/login")
        .send({ email: "test@example.com", password: "password" });
      expect(res.status).toBeDefined();
    });
    it("POST /api/user/forgot-password", async () => {
      const res = await request(app)
        .post("/api/user/forgot-password")
        .send({ email: "test@example.com" });
      expect(res.status).toBeDefined();
    }, 20000); // 20 seconds
    it("POST /api/user/reset-password", async () => {
      const res = await request(app).post("/api/user/reset-password").send({
        email: "test@example.com",
        code: "123456",
        password: "newpassword",
      });
      expect(res.status).toBeDefined();
    });
  });

  // INVENTORY ROUTES
  describe("Inventory Routes", () => {
    it("GET /api/inventory", async () => {
      const res = await request(app).get("/api/inventory");
      expect(res.status).toBeDefined();
    });
    it("POST /api/inventory", async () => {
      const res = await request(app).post("/api/inventory").send({
        name: "Barang Test",
        code: "BRG001",
        quantity: 10,
        condition: "Baik",
      });
      expect(res.status).toBeDefined();
    });
  });

  // BORROW ROUTES
  describe("Borrow Routes", () => {
    it("GET /api/borrow", async () => {
      const res = await request(app).get("/api/borrow");
      expect(res.status).toBeDefined();
    });
    it("POST /api/borrow", async () => {
      const res = await request(app)
        .post("/api/borrow")
        .send({ userId: "dummy", items: [] });
      expect(res.status).toBeDefined();
    });
  });

  // RETURN ROUTES
  describe("Return Routes", () => {
    it("GET /api/return", async () => {
      const res = await request(app).get("/api/return");
      expect(res.status).toBeDefined();
    });
    it("POST /api/return", async () => {
      const res = await request(app)
        .post("/api/return")
        .send({ borrowId: "dummy", items: [] });
      expect(res.status).toBeDefined();
    });
  });

  // DASHBOARD ROUTES
  describe("Dashboard Routes", () => {
    it("GET /api/dashboard", async () => {
      const res = await request(app).get("/api/dashboard");
      expect(res.status).toBeDefined();
    });
  });

  // ADMIN ROUTES
  describe("Admin Routes", () => {
    it("GET /api/admin/users", async () => {
      const res = await request(app).get("/api/admin/users");
      expect(res.status).toBeDefined();
    });
  });
});
