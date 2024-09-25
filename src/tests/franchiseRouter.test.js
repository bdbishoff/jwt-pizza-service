const request = require("supertest");
const app = require("../service.js");
const { Role } = require("../model/model.js");
const { DB } = require("../database/database.js"); // Adjusted path

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  await DB.addUser(user);

  user.password = "toomanysecrets";
  return user;
}

let adminUser;

beforeAll(async () => {
  adminUser = await createAdminUser();
  expect(adminUser).toBeTruthy();
});

test("getFranchises", async () => {
  const result = await request(app).get("/api/franchise").send(adminUser);
  expect(result.status).toBe(200);
});

afterAll(async () => {
  // Make sure to close any database connections after tests
  (await DB.getConnection()).end();
});
