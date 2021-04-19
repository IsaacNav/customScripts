const ProductProcess = require("./ProductsProcess");

const TOTALS_PER_OPERATION = 200;

const process = async (config) => {
  try {
    const layoutPipeline = new ProductProcess(config);
    await layoutPipeline.getUser();
    await layoutPipeline.createProduct();
    await layoutPipeline.disableProduct();
    layoutPipeline.done();
  } catch (error) {
    throw error;
  }
};

/**
 *
 * @param {Object} config
 * @param {function} storage - closure
 */
const doOperation = (config) => {
  try {
    process(config);
  } catch (error) {
    console.error(error);
  }
};

/**
 *
 * @param {Object} config
 * @returns {function} recursion
 */
const processBatch = async (config) => {
  const { rows, events, ...rest } = config;
  const localRows = [...rows];
  const batch = localRows.splice(0, TOTALS_PER_OPERATION);
  const recordIds = batch.map((item) => item._id);

  try {
    const promiseBatch = batch.map(async (item) => {
      return doOperation({ item, ...rest });
    });

    await Promise.all(promiseBatch);

    events.saveData(batch);

    if (localRows.length) return processBatch(localRows, storage);
  } catch (error) {
    throw new Error(
      `Error al procesar batch ${recordIds} debido a: ${error.message}`
    );
  }
};

/**
 *
 * @param {Object} config
 */
const exec = async (config) => {
  const events = new Events();
  events.exec();

  try {
    console.log("Start pipeline");

    await processBatch({ ...config, events });

    console.log("End pipeline");
  } catch (erroror) {
    console.error(erroror);
  } finally {
    events.end();
  }
};

module.exports = exec;
