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
let adminUserToken;

beforeAll(async () => {
  adminUser = await createAdminUser();
  expect(adminUser).toBeTruthy();
  result = await request(app).put("/api/auth").send(adminUser);
  adminUserToken = result.body.token;
  expect(adminUserToken).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
});

/*-------------------------------------setup--------------------------------- */

test("getFranchises", async () => {
  const getFranchiseResult = await request(app).get("/api/franchise").send(adminUser);
  expect(getFranchiseResult.status).toBe(200);
});

test("getUserFranchises", async () => {
  const getUserFranchiseResult = await request(app)
    .get(`/api/franchise/${adminUser.id}`)
    .set("Authorization", `Bearer ${adminUserToken}`);
  expect(getUserFranchiseResult.status).toBe(200);
  expect(getUserFranchiseResult.body.length).toBe(0);
});

test("createFranchise", async () => {
  const name = randomName();
  const franchise = { name: name, admins: [{ email: adminUser.email }] };
  const createFranchiseResult = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send(franchise);
  expect(createFranchiseResult.status).toBe(200);
  expect(createFranchiseResult.body.name).toBe(name);
  expect(createFranchiseResult.body.admins[0].email).toBe(adminUser.email);

  const getUserFranchiseResult = await request(app)
    .get(`/api/franchise/${createFranchiseResult.body.admins[0].id}`)
    .set("Authorization", `Bearer ${adminUserToken}`);
  expect(getUserFranchiseResult.status).toBe(200);
  expect(getUserFranchiseResult.body.length).toBe(1);
});

test("deleteFranchise", async () => {
  const name = randomName();
  const franchise = { name: name, admins: [{ email: adminUser.email }] };
  const createFranchiseResult = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send(franchise);
  expect(createFranchiseResult.status).toBe(200);
  const deleteFranchiseResult = await request(app)
    .delete(`/api/franchise/${createFranchiseResult.body.id}`)
    .set("Authorization", `Bearer ${adminUserToken}`);
  expect(deleteFranchiseResult.status).toBe(200);
});

test("Fail createFranchiseStore", async () => {
  const name = randomName();
  const franchise = { name: name, admins: [{ email: adminUser.email }] };
  const createFranchiseResult = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send(franchise);
  expect(createFranchiseResult.status).toBe(200);
  expect(createFranchiseResult.body.name).toBe(name);
  expect(createFranchiseResult.body.admins[0].email).toBe(adminUser.email);

  const createFranchiseStoreResult = await request(app)
    .post(`/api/${franchise.id}/store`)
    .set("Authorization", `Bearer ${adminUserToken}`);
  expect(createFranchiseStoreResult.status).toBe(404);
});

test("Success createFranchiseStore", async () => {
  const name = randomName();
  const franchise = { name: name, admins: [{ email: adminUser.email }] };
  const createFranchiseResult = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send(franchise);
  expect(createFranchiseResult.status).toBe(200);
  expect(createFranchiseResult.body.name).toBe(name);
  expect(createFranchiseResult.body.admins[0].email).toBe(adminUser.email);

  const createFranchiseStoreResult = await request(app)
    .post(`/api/franchise/${createFranchiseResult.body.id}/store`)
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send(adminUser);
  expect(createFranchiseStoreResult.status).toBe(200);
  expect(createFranchiseStoreResult.body.name).toBe(adminUser.name);
});

test("deleteFranchiseStore", async () => {
  // Create franchise store
  const name = randomName();
  const franchise = { name: name, admins: [{ email: adminUser.email }] };
  const createFranchiseResult = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send(franchise);
  expect(createFranchiseResult.status).toBe(200);
  expect(createFranchiseResult.body.name).toBe(name);
  expect(createFranchiseResult.body.admins[0].email).toBe(adminUser.email);

  const createFranchiseStoreResult = await request(app)
    .post(`/api/franchise/${createFranchiseResult.body.id}/store`)
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send(adminUser);
  expect(createFranchiseStoreResult.status).toBe(200);

  // Delete store
  const deleteFranchiseStoreResult = await request(app)
    .delete(
      `/api/franchise/${createFranchiseResult.body.id}/store/${createFranchiseStoreResult.body.id}`
    )
    .set("Authorization", `Bearer ${adminUserToken}`);
  expect(deleteFranchiseStoreResult.status).toBe(200);
  expect(deleteFranchiseStoreResult.body.message).toBe("store deleted");
});

/*-------------------------------------teardown--------------------------------- */

afterAll(async () => {
  (await DB.getConnection()).end();
});
