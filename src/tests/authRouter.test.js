const request = require("supertest");
const app = require("../service.js");

const testUser = {
  name: "pizza diner",
  email: "reg@test.com",
  password: "a",
};

let testUserAuthToken;
let testUserRegistered;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserRegistered = registerRes.body.user;
});

test("login and logout", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
  expect(loginRes.body.user).toMatchObject(user);
  expect(password).toBeTruthy();

  const token = loginRes.body.token;

  const logoutRes = await request(app).delete("/api/auth").set("Authorization", `Bearer ${token}`);

  expect(logoutRes.status).toBe(200);
  expect(logoutRes.body.message).toBe("logout successful");
});

test("fail register", async () => {
  const invalidUser = { ...testUser, name: "" };
  const registerRes = await request(app).post("/api/auth").send(invalidUser);
  expect(registerRes.status).toBe(400);
  expect(registerRes.body.message).toBe("name, email, and password are required");
});

test("update user", async () => {
  const updatedUserData = {
    email: "updated_" + testUser.email,
    password: "newpassword",
  };

  const updateRes = await request(app)
    .put(`/api/auth/${testUserRegistered.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(updatedUserData);

  expect(updateRes.status).toBe(200);

  const updatedUser = {
    ...testUserRegistered,
    email: updatedUserData.email,
  };

  expect(updateRes.body).toMatchObject({
    ...updatedUser,
  });
});

// test github action
