const chalk = require("chalk");
const child_process = require("child_process");

function logError(title, ...errors) {
  console.error(chalk.red("error") + " " + chalk.white(title));
  errors.map((error) => console.error(chalk.white(error)));
}

function logWarning(title) {
  console.log(chalk.yellow("warning ") + chalk.white(title));
}

function logSuccess(title) {
  console.log(chalk.green("success ") + chalk.white(title));
}

function logInfo(title) {
  console.log(chalk.blue("info ") + chalk.white(title));
}

exports.logError = logError;
exports.logWarning = logWarning;
exports.logSuccess = logSuccess;
exports.logInfo = logInfo;
