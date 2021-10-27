#! /usr/bin/env node

const pjson = require("../package.json");
const { Command } = require("commander");
const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const child_process = require("child_process");
const packlist = require("npm-packlist");
const helpers = require("../helpers");

const program = new Command();

program.version(pjson.version);
program.option("-d, --debug", "output extra debugging");

program.action(async (source) => {
  const packageJson = require(process.cwd() + "/package.json");
  const configFileName = program.config || "worx-dev-tools.json";
  let config;

  try {
    config = JSON.parse(fs.readFileSync(path.resolve(configFileName), "utf8"));
  } catch (error) {
    helpers.logError(error.message);
    return;
  }
  const files = packlist.sync();

  if (!config.copyPackages) {
    helpers.logError(
      `Config file ${chalk.yellow.bold(configFileName)} incomplete.`,
      `Add required copyPackages parameter. See ${chalk.cyan.italic(
        "https://github.com/worx-to/worx-dev-tools#copy-package-configuration"
      )}`
    );
    return;
  }

  console.log(chalk.green(`Package copied:`));
  config.copyPackages.paths.forEach((path) => {
    const dest = `${path}/node_modules/${packageJson.name}`;
    console.log(chalk.magenta.bold(` ${program.opts().debug ? dest : path}`));
    files.forEach((file, index, arr) => {
      child_process.exec(`cp -rf ${file} ${dest}`);
      if (program.opts().debug) {
        console.log(`   ${index === arr.length - 1 ? "╚" : "╠"}══ ${file}`);
      }
    });
    if (!program.opts().debug) {
      console.log(`   └─ ${files.length} files copied`);
    }
  });
});

program.parse(process.argv);
