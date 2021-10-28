#! /usr/bin/env node
const pjson = require("../package.json");
const { Command } = require("commander");
const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const helpers = require("../helpers");

const program = new Command();

program.version(pjson.version);
program.option("-d, --debug", "output extra debugging");

program.action(async (source) => {
  const configFileName = "worx-dev-tools.json";
  let config;

  try {
    config = JSON.parse(fs.readFileSync(path.resolve(configFileName), "utf8"));
  } catch (error) {
    helpers.logError(error.message);
    return;
  }

  if (!config.trashTypes) {
    helpers.logError(
      `Config file ${chalk.yellow.bold(configFileName)} incomplete.`,
      `Add required trashTypes parameter. See ${chalk.cyan.italic(
        "https://github.com/worx-to/worx-dev-tools#clean-types-configuration"
      )}`
    );
    return;
  }

  console.log("");
  console.log(`🗑️  Remove trash types...`);

  helpers.logSuccess(`types cleared:`);
  config.trashTypes.forEach((path, index, arr) => {
    const dir = `./node_modules/@types/${path}/node_modules/@types/react/`;

    fs.rm(dir, { recursive: true }, () => {});
    console.log(`   ${index === arr.length - 1 ? "└" : "├"}─ ${chalk.magenta.bold(program.opts().debug ? dir : path)}`);
  });
});

program.parse(process.argv);
