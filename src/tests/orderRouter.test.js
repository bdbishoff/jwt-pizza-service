const request = require("supertest");
const app = require("../service.js");
const { Role } = require("../model/model.js");
const { DB } = require("../database/database.js");

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
  const result = await request(app).put("/api/auth").send(adminUser);
  adminUserToken = result.body.token;
  expect(adminUserToken).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
});

test("getMenu", async () => {
  const getMenuResult = await request(app).get("/api/order/menu");
  expect(getMenuResult.status).toBe(200);
});

test("addMenuItem", async () => {
  const addMenuItemResult = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send({ title: randomName(), description: randomName(), image: randomName(), price: 0.1 });
  console.log(addMenuItemResult);
  expect(addMenuItemResult.status).toBe(200);

  const getMenuResult = await request(app).get("/api/order/menu");
  expect(getMenuResult.status).toBe(200);
});

test("getOrders", async () => {
  const getOrdersResult = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send(adminUser);
  expect(getOrdersResult.status).toBe(200);
  expect(getOrdersResult.body.orders.length).toBe(0);
});

test("createOrder", async () => {
  const createOrderResult = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${adminUserToken}`)
    .send({
      franchiseId: 1,
      storeId: 1,
      items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
    });
  expect(createOrderResult.status).toBe(200);
  expect(createOrderResult.body.order.items.length).toBe(1);
});

afterAll(async () => {
  (await DB.getConnection()).end();
});
