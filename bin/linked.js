#! /usr/bin/env node

const pjson = require("../package.json");
const { Command } = require("commander");
const helpers = require("../helpers");
const util = require("util");
const fs = require("fs");
const path = require("path");
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

  console.log("");
  console.log("🔍  Looking for linked packages...");
  if (!packages.length) {
    helpers.logSuccess("you have no linked packages");
    return;
  }

  helpers.logWarning("linked packages");
  packages.forEach((package) => {
    console.log(" └─ " + package.replace("./node_modules/", ""));
  });

  try {
    const configFileName = "worx-dev-tools.json";
    const config = JSON.parse(fs.readFileSync(path.resolve(configFileName), "utf8"));

    const { dependencies } = config;
    if (!dependencies) {
      return;
    }
    const changedDeps = Object.values(dependencies).filter((dep) => dep.type !== "npm");

    if (changedDeps.length > 0) {
      helpers.logWarning("also check your 'worx-dev-tools.dependencies'");
      for (const depKey in dependencies) {
        const dep = dependencies[depKey];
        const color = {
          link: "blue",
          git: "red",
          local: "yellow",
        };
        if (dep.type !== "npm") {
          console.log(` └─ ${depKey} installed as ${chalk[color[dep.type]](dep.type)}`);
        }
      }
    }
  } catch (error) {
    console.log(error);
    return;
  }
});

program
  .command("unlink")
  .option("-a, --all", "unlink all packages")
  .option("-s, --skip-install", "skip force reinstall")
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

    console.log("");
    console.log("🔥 Unlink packages...");
    helpers.logSuccess("unlinked packages:");

    await Promise.all(
      _packages.map(async (package) => {
        await exec(`yarn unlink ${package}`);
        console.log(" └─ " + package);
      })
    );
    if (!options.skipInstall) {
      console.log("🚚 reinstall packages...");
      await exec("yarn install --force");
    }
    console.log(`✨  Done in ${(Date.now() - start) / 1000}s`);
  });

program.parse(process.argv);
