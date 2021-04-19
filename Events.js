const EventEmitter = require("events");

const processPing = (message) => {
  console.log(`Process: ${message}`);
};

const endPing = (message) => {
  console.log(`End process: ${message}`);
};

class Events extends EventEmitter {
  exec() {
    super.on("processPing", processPing);
    super.on("endPing", endPing);
  }

  saveData(items) {
    const totalItems = items.length;
    const totalAmount = items.reduce((acc, item) => {
      const { amount = 0 } = item || {};
      acc += amount;
      return acc;
    }, 0);

    this.totalAmount += totalAmount;
    this.totalItems += totalItems;

    super.emit(
      "processPing",
      `Total items guardados: ${totalItems} por un total de $ ${totalAmount}`
    );
  }

  end() {
    const { totalAmount, totalItems } = this;

    super.emit(
      "endPing",
      `Total items procesados: ${totalItems} por un total de $ ${totalAmount}`
    );
  }
}

module.exports = Events;
