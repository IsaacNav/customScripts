/* eslint-disable no-console */
require("../config/db");

const ShoppingHistoryUseCase = require("../useCases/ShoppingHistoryUseCase");
const UsersModel = require("../models/users");
const CreateCsv = require("../CreateFile");

const TOTALS_PER_OPERATION = 250;

const configSchema = {
  email: "email",
  key: "key",
  address: "userAddress",
  items: "products",
  amount: "totalAmount",
  createdAt: "date",
  updatedAt: "lastConfirmation",
};

const storageRecord = (headers = config) => {
  let countItems = 0;

  const file = new CreateCsv(headers);
  file.createFile();

  return async (item = null) => {
    if (item) {
      const data = formatData(item, headers);

      await file.addDataToFile(data);
      countItems += 1;
      return countItems;
    }
    return countItems;
  };
};

const checkShoppingStatus = async (user, storage) => {
  const shoppingHistoryUseCase = new ShoppingHistoryUseCase();
  const { _id: userId = "", email = "", key = "" } = user;
  try {
    const lastShopping = await shoppingHistoryUseCase.lastShoppingStatus(
      userId
    );
    await storage({ ...lastShopping, email, key });
  } catch (err) {
    throw new Error(
      `Error al obtener la última compra del ususario ${userId} debido a: ${err.message}`
    );
  }
};

const doOperation = (item, storage) => {
  try {
    return checkShoppingStatus(item, storage);
  } catch (err) {
    console.error(err);
    return null;
  }
};

const processBatch = async (items, storage) => {
  const localItems = [...items];
  const batch = localItems.splice(0, TOTALS_PER_OPERATION);

  try {
    const promiseBatch = batch.map(async (item) => {
      return doOperation(item, storage);
    });

    const processedBatch = await Promise.all(promiseBatch);
    console.log(`Usuarios procesados: ${processedBatch.length}`);

    if (localItems.length) return processBatch(localItems, storage);
    return true;
  } catch (err) {
    throw new Error(`Error al procesar batch debido a: ${err.message}`);
  }
};

(async () => {
  try {
    const items = await UsersModel.find({ delegation }).lean();
    const count = items.length;
    const storage = storageRecord();

    console.log("Start pipeline");

    await processBatch(items, userId, storage);

    console.log(`End pipeline, ${count} processed users`);

    const result = await storage();
    console.log(result);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
})();
