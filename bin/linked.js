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
  let packages = await getLinked();

  console.log("");
  console.log("🔍  Looking for linked packages...");
  let founded = false;
  try {
    const configFileName = "worx-dev-tools.json";
    const config = JSON.parse(fs.readFileSync(path.resolve(configFileName), "utf8"));
    const packageJson = require(process.cwd() + "/package.json");

    const { dependencies } = config;
    if (!dependencies) {
      return;
    }
    const changedDeps = Object.values(dependencies).filter((dep) => dep.type !== "npm");
    let foundedArr = [];
    if (changedDeps.length > 0) {
      for (const depKey in dependencies) {
        const dep = dependencies[depKey];

        if (dep.type === "link" && packages.includes(depKey)) {
          packages = packages.filter((package) => depKey !== package);
          foundedArr.push({ ...dep, name: depKey });
        }
        if (dep.type === "git" && /git|http/.test(packageJson.dependencies[depKey])) {
          foundedArr.push({ ...dep, name: depKey });
        }
        if (dep.type === "local") {
          if (fs.existsSync(`./node_modules/${depKey}/.copyrc.txt`)) {
            foundedArr.push({ ...dep, name: depKey });
          }
        }
      }
      if (foundedArr.length) {
        helpers.logWarning("founded with your 'worx-dev-tools.dependencies'");
        const colors = {
          link: "blue",
          git: "red",
          local: "green",
        };
        foundedArr.forEach((dep, index, arr) => {
          console.log(
            ` ${index === arr.length - 1 ? "└" : "├"}─ ${dep.name} installed as ${chalk[colors[dep.type]](dep.type)}`
          );
        });
        founded = true;
      }
    }
  } catch (error) {
    console.log(error);
    return;
  }

  if (packages.length) {
    helpers.logWarning("linked packages");
    packages.forEach((package, index, arr) => {
      console.log(` ${index === arr.length - 1 ? "└" : "╠"} ${package}`);
    });
  }
  if (!founded) {
    helpers.logSuccess("you have no linked packages");
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
      helpers.logSuccess("you have no linked packages");
      return;
    }

    console.log("");
    console.log("🔥 Unlink packages...");
    helpers.logSuccess("unlinked packages:");

    await Promise.all(
      _packages.map(async (package, index, arr) => {
        await exec(`yarn unlink ${package}`);
        console.log(` ${index === arr.length - 1 ? "└" : "├"}─ ${package}`);
      })
    );
    if (!options.skipInstall) {
      console.log("🚚 reinstall packages...");
      await exec("yarn install --force");
    }
    console.log(`✨  Done in ${(Date.now() - start) / 1000}s`);
  });

program.parse(process.argv);
