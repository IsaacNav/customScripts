/* eslint-disable no-underscore-dangle */
/* eslint-disable consistent-return */
/* eslint-disable camelcase */
const moment = require("moment");
const { transformKeys } = require("../../helpers/layouts/utils");
const EmployeeUseCase = require("../../useCases/employee");
const CreditRequestUseCase = require("../../useCases/creditRequest");
const CreditUseCase = require("../../useCases/credits");
const { formatData } = require('./utils');

const employeeUseCase = new EmployeeUseCase();
const creditRequestUseCase = new CreditRequestUseCase();
const creditUseCase = new CreditUseCase();

const INVOCES_TYPES = {
  CURRENT: "Corriente",
};

const configSchema = {
  description: "generalDescription",
  specifications: "technicalDescription",
  name: "title",
  image: "principalImage",
  price: "fullPrice",
  discount: "discount",
  comments: "reviews",
  brand: "sellerId",
};

class CreateProductsPipeline {
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

      return userDoc._doc;
    } catch (err) {
      // eslint-disable-next-line no-console
      throw new Error(
        `Error al obtener el ususario ${user} debido a: ${err.message}`
      );
    }
  }

  async createProduct() {
    try {
      const { product, schema } = this;

      if (product && schema) {
        const productTransformed = transformKeys(product, schema);
        const {
          description,
          name,
          image,
          price,
          discount,
          comments,
        } = productTransformed;

        const price = this._getPrice(price, discount);
        if (!price)
          throw new Error(
            `Error al obtener el precio del producto valor: ${price}`
          );

        const newProduct = {
          comercialHouse: this.comercialHouse._id,
          employee: this.employee._id,
         ...formatData(configSchema)
          price: price * (discount / 100),
          createdBy: this.user,
        };

        const creditRequestCreated = await creditRequestUseCase.store(
          this.user,
          newCreditRequest
        );
        this.creditRequest = creditRequestCreated.toObject();
        this.process = {
          ...this.process,
          creditRequestId: this.creditRequest._id,
        };
        return creditRequestCreated;
      }
      return null;
    } catch (err) {
      throw err;
    }
  }

  async acceptCreditRequest() {
    if (this.creditRequest) {
      const credit = await creditRequestUseCase.accept(
        this.creditRequest._id,
        this.user
      );
      this.process = {
        ...this.process,
        portfolioId: credit.portfolioId,
      };
      this.credit = credit.toObject();
      return this.credit;
    }
    return null;
  }

  async closeInvoices() {
    const { paymentNumber } = transformKeys(
      this.row,
      this.schema.creditColumns
    );

    if (this.credit && paymentNumber) {
      const { portfolioId } = this.credit;
      const closedInvoices = await creditUseCase.closeInvoices(
        portfolioId,
        paymentNumber
      );
      this.process = {
        ...this.process,
        closedInvoices,
      };
    }
    return null;
  }

  async partialPayments() {
    const { paymentNumber, partialPayment } = transformKeys(
      this.row,
      this.schema.creditColumns
    );

    if (this.credit && partialPayment) {
      try {
        const { portfolioId } = this.credit;
        const nexPayment = paymentNumber + 1;
        const invoice = await creditUseCase.getOneInvoice(
          portfolioId,
          nexPayment
        );
        const {
          tax = 0,
          amount,
          paymentNumber: number,
          balance,
          interest = 0,
          due_date,
        } = invoice;
        const capital = partialPayment - interest - tax;

        const partialInvoice = await creditUseCase.payOneInvoice({
          type: INVOCES_TYPES.CURRENT,
          payment: amount,
          amount: partialPayment,
          payroll: number,
          credit: portfolioId,
          tax,
          balance,
          interest,
          createdAt: due_date,
          capital: capital < 0 ? 0 : capital,
        });

        this.process = {
          ...this.process,
          partialInvoice,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(
          `Error en partialPayments para el crédito ${
            this.credit._id
          } portfolioId ${this.credit.portfolioId} debido a ${error.toString()}`
        );
      }
    }

    return null;
  }

  async advancePayment() {
    const { advancePayment } = transformKeys(
      this.row,
      this.schema.creditColumns
    );

    if (this.credit && advancePayment) {
      const { portfolioId } = this.credit;
      const advanceInvoices = await creditUseCase.advancePayment(
        portfolioId,
        advancePayment
      );

      this.process = {
        ...this.process,
        advanceInvoices,
      };
    }

    return null;
  }

  done() {
    return this.process;
  }

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
}

module.exports = CreateProductsPipeline;
