#! /usr/bin/env node

const pjson = require("../package.json");
const { Command } = require("commander");
const helpers = require("../helpers");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const execSync = require("child_process").exec;
const chalk = require("chalk");

const program = new Command();

program.version(pjson.version);

const getLinked = async () => {
  try {
    const { stdout, stderr } = await exec("find . -type l | grep -v .bin");
    if (!stdout) {
      return [];
    }
    return stdout
      .split("\n")
      .filter((item) => item)
      .map((item) => item.replace("./node_modules/", ""));
  } catch (e) {
    return [];
  } finally {
  }
};

program.command("check").action(async (source) => {
  const packages = await getLinked();
  if (!packages.length) {
    console.log(chalk.green("You have no linked packages"));
    return;
  }

  helpers.logWarning("Linked packages");
  packages.forEach((package) => {
    console.log(" └─ " + package.replace("./node_modules/", ""));
  });
});

program
  .command("unlink")
  .option("-a, --all", "unlink all packages")
  .argument("[packages...]", "packages for unlink")
  .action(async (packages = [], options) => {
    const start = Date.now();
    let _packages = packages;

    if (options.all) {
      _packages = await getLinked();
    }

    if (_packages.length === 0) {
      return;
    }

    helpers.logSuccess("Unlinked packages");

    await Promise.all(
      _packages.map(async (package) => {
        await exec(`yarn unlink ${package}`);
        console.log(" └─ " + package);
      })
    );
    console.log("🚚 reinstall packages...");
    await exec("yarn install --force");
    console.log(`✨  Done in ${(Date.now() - start) / 1000}s`);
  });

program.parse(process.argv);
