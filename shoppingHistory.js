const UsersUseCase = require("./useCases/UsersUseCase");
const UsersModel = require("./models/users");
const CreateCsv = require("./CreateCsv");

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

/**
 *
 * @param {Object} headers
 * @returns {function} closure
 */
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

/**
 *
 * @param {Object} user
 * @param {function} storage - closure
 */
const generateShoopingHistory = async (user, storage) => {
  const usersUseCase = new UsersUseCase();
  const { _id: userId = "", email = "", key = "" } = user;
  try {
    const lastShopping = await usersUseCase.shoopingHistory(userId);
    await storage({ ...lastShopping, email, key });
  } catch (error) {
    throw new Error(
      `Error al obtener historial de compra del ususario ${userId} debido a: ${error.message}`
    );
  }
};

/**
 *
 * @param {Object} item
 * @param {function} storage - closure
 */
const doOperation = (item, storage) => {
  try {
    generateShoopingHistory(item, storage);
  } catch (error) {
    console.error(error);
  }
};

/**
 *
 * @param {Object[]} items
 * @param {function} storage - closure
 * @returns {function} recursion
 */
const processBatch = async (items, storage) => {
  const localItems = [...items];
  const batch = localItems.splice(0, TOTALS_PER_OPERATION);
  const recordIds = batch.map((item) => item._id);

  try {
    const promiseBatch = batch.map(async (item) => {
      return doOperation(item, storage);
    });

    const processedBatch = await Promise.all(promiseBatch);
    console.log(`Usuarios procesados: ${processedBatch.length}`);

    if (localItems.length) return processBatch(localItems, storage);
  } catch (error) {
    throw new Error(
      `Error al procesar batch ${recordIds} debido a: ${error.message}`
    );
  }
};

/**
 *
 * @param {Object} params
 */
const exec = async (params) => {
  const {
    data: { now = new Date() },
    done,
  } = params;

  try {
    const query = {}; // TODO:
    const items = await UsersModel.find(query).lean();

    const count = items.length;
    const storage = storageRecord();

    console.log("Start shoppingHistory pipeline");

    await processBatch(items, storage);

    console.log(`End shoppingHistory pipeline, ${count} processed users`);

    const result = await storage();
    done(result);
  } catch (error) {
    console.error(error);
  }
};

module.exports = exec;
