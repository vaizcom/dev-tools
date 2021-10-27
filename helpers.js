const chalk = require("chalk");

function logError(title, ...errors) {
  console.error(chalk.bgRed.white.bold(" Error ") + " " + chalk.red(title));
  errors.map((error) => console.error(chalk.red(error)));
}

function logWarning(title) {
  console.error(chalk.bgYellow.black.bold(" Warning ") + " " + chalk.yellow(title));
}

function logSuccess(title) {
  console.error(chalk.bgGreen.black.bold(" Success ") + " " + chalk.green(title));
}

exports.logError = logError;
exports.logWarning = logWarning;
exports.logSuccess = logSuccess;
