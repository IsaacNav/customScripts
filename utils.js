/**
 *
 * @param {Object} param0
 * @returns {Object}
 */
const transformData = ({ obj, schema }) => {
  return Object.keys(schema).reduce((acc, key) => {
    const newKey = schema[key];
    const value = obj[key];
    acc[newKey] = value;
    return acc;
  }, {});
};

/**
 *
 * @param {Object} row - csv row
 * @param {Object} mapping - schema mapping
 * @returns {Object}
 */
const transformKeys = (row, mapping) => {
  return mapping.reduce((acc, map) => {
    const { column, key, format = "" } = map;
    if (column in row) {
      acc[key] = row[column];
    }
    if (format) acc.format = format;
    return acc;
  }, {});
};

module.exports = {
  transformData,
  transformKeys,
};
