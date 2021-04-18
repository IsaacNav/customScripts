/**
 *
 * @param {Object}
 * @returns {Array}
 */
const formatData = ({ data, schema }) => {
  return Object.keys(schema).reduce((acc, key) => {
    const newKey = schema[key];
    const value = data[key];
    acc[newKey] = value;
    return acc;
  }, {});
};

module.exports = {
  formatData,
};
