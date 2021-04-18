const os = require("os");
const fs = require("fs");
const path = require("path");
const util = require("util");

const { createUUID } = require("./utils");

class CreateCsv {
  constructor(config) {
    this.config = config;
    this.fileName = `${createUUID()}.csv`;
    this.appendFile = util.promisify(fs.appendFile);
    this.writeFile = util.promisify(fs.writeFile);
  }

  async addDataToFile(data) {
    const formattedValues = `${data.join(",")}\n`;
    await this.appendFile(this.filePath, formattedValues);
  }

  async createFile(fileName = null) {
    const { config } = this;
    const filaName = fileName ? `${fileName}.csv` : this.fileName;
    const headers = Object.keys(config);

    this.fileName = filaName;
    this.filePath = path.join(os.tmpdir(), filaName);

    await this.writeFile(this.filePath, `${headers}\n`);
  }

  done() {
    return {
      fileName: this.fileName,
      filePath: this.filePath,
    };
  }
}

module.exports = CreateCsv;
