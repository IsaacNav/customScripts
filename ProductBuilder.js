/* eslint-disable no-underscore-dangle */
const { STATUS_TYPES } = require("./constants");

class ProductBuilder {
  constructor() {
    this._product = {
      status: "",
      description: "",
      technicalDescription: "",
      title: "",
      principalImage: "",
      fullPrice: "",
      discount: "",
      price: "",
      key: "",
      sellerId: "",
      color: "",
      size: "",
      stock: 0,
    };
  }

  create(product) {
    this.product = product;
    return this;
  }

  setStatus(status = "") {
    this.product.status = STATUS_TYPES[status] || STATUS_TYPES.ON_HOLD;
    return this;
  }

  addColor(sizesAndColors = "") {
    this.product.color = color;
    return this;
  }

  addSizes(size = "") {
    this.product.size = size;
    return this;
  }

  addStock(stock = "") {
    this.product.stock = stock;
    return this;
  }

  reset() {
    this.product = { ...this._product };
  }

  build() {
    const product = { ...this.product };
    this.reset();
    return product;
  }
}

module.exports = ProductBuilder;
