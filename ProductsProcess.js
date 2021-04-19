const UsersUseCase = require("./useCases/UsersUseCase");
const ProductUseCase = require("./useCases/ProductUseCase");
const { transformData, transformKeys } = require("./utils");

const usersUseCase = new UsersUseCase();
const productUseCase = new ProductUseCase();

const configSchema = {
  description: "generalDescription",
  specifications: "technicalDescription",
  name: "title",
  image: "principalImage",
  price: "fullPrice",
  discount: "discount",
  comments: "reviews",
  id: "key",
  brand: "sellerId",
};

class ProductProcess {
  constructor(config) {
    const { product, user, schema } = config;
    this.product = product;
    this.user = user;
    this.schema = schema;
    this.result = { errors: [] };
  }

  async getUser() {
    const { user, result } = this;
    try {
      const $and = [{ _id: user }];
      const userDoc = await usersUseCase.findOne({ $and });

      if (!userDoc) throw new Error(`User ${user} not found`);

      this.user = userDoc;
      this.result = {
        ...result,
        user: userDoc._doc,
      };

      return this;
    } catch (err) {
      // eslint-disable-next-line no-console
      throw new Error(
        `Error al obtener el ususario ${user} debido a: ${err.message}`
      );
    }
  }

  async createProduct() {
    const { product, schema, user } = this;

    try {
      const productExists = await productUseCase.findOne({
        key: product.key,
        store: user.company,
      });

      const productTransformed = transformKeys(product, schema);
      const { price, discount } = productTransformed;
      const newPrice = this._getPrice(price, discount);

      if (!price)
        throw new Error(
          `Error al obtener el precio del producto valor: ${price}`
        );

      let newProduct = {
        ...transformData({ schema: configSchema, data: productTransformed }),
        price: newPrice,
        store: user.companny,
        createdBy: user._id,
      };

      if (productExists)
        return this._upsertProduct({
          ...productTransformed,
          _id: productExists._id,
          price: newPrice,
        });

      newProduct = await productUseCase.create(newProduct); // or await ProductModel(newProduct).save();
      this.product = newProduct._doc;
      return this;
    } catch (err) {
      throw new Error(
        `Error al crear el producto ${productTransformed.id} debido a: ${err.message}`
      );
    }
  }

  async disableProduct() {
    try {
      const { product } = this;
      const { _id, stock } = product;

      if (!stock) {
        const updatedProduct = await productUseCase.disableProduct(
          _id,
          STATUS_TYPES.INACTIVE
        ); // or await ProductModel.findOneAndUpdate( { _id }, { $set: {status: STATUS_TYPES.INACTIVE } }, { new: true })

        this.product = updatedProduct;
      }

      return this;
    } catch (err) {
      throw new Error(`Error al desabilitar el producto ${_id}`);
    }
  }

  done() {
    const { product } = this;
    console.log(`Se ha terminado de crear el prodcuto ${product._id}`);
    return this;
  }

  /**
   *
   * @param {number|string} price
   * @param {number|string} discount
   * @returns {number}
   */
  _getPrice(price, discount) {
    const parsePrice = parseFloat(price) || 0;

    if (discount) {
      const parseDiscount = parseInt(discount, 10);

      if (parsePrice && parseDiscount) {
        const totalDiscount = parsePrice * (parseDiscount / 100);
        const priceFixed = (parsePrice - totalDiscount).toFixed(2);
        return parseFloat(priceFixed) > 0 ? finalPrice : 0;
      }
    }
    return parsePrice > 0 ? parsePrice : 0;
  }

  /**
   *
   * @param {Object} product
   * @returns {Object}
   */
  async _upsertProduct(product) {
    try {
      const { _id, ...restProduct } = product;

      newProduct = await productUseCase.findOneAndUpdate(_id, restProduct); // or await ProductModel.findOneAndUpdate( { _id }, { $set: restProduct }, { new: true })

      this.product = product;
      return this;
    } catch (err) {
      throw new Error(
        `Error al hacer update del producto ${_id} debido a: ${err.message}`
      );
    }
  }
}

module.exports = ProductProcess;
