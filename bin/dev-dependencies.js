#! /usr/bin/env node
const pjson = require("../package.json");
const { Command } = require("commander");
const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const helpers = require("../helpers");
const util = require("util");
const packlist = require("npm-packlist");
const chalk = require("chalk");
const program = new Command();
const exec = util.promisify(require("child_process").exec);
const child_process = require("child_process");
const semver = require("semver");
const rimraf = require("rimraf");
const homedir = require("os").homedir();

program.version(pjson.version);
program.option("-d, --debug", "output extra debugging");

const priority = ["git", "link", "local"];

program.action(async (source) => {
  const configFileName = "worx-dev-tools.json";
  let config;

  try {
    config = JSON.parse(fs.readFileSync(path.resolve(configFileName), "utf8"));
  } catch (error) {
    helpers.logError(error.message);
    return;
  }
  const { dependencies } = config;

  if (!dependencies) {
    return;
  }
  console.log("");
  console.log(`⏳ Install dev-dependencies...`);
  const depsArray = [];

  for (const packageKey in dependencies) {
    if (!Object.hasOwnProperty.call(dependencies, packageKey)) {
      return;
    }
    const packageConfig = dependencies[packageKey];
    depsArray.push({
      ...packageConfig,
      packageKey,
      priority: priority.findIndex((item) => item === packageConfig.type),
    });
  }

  depsArray.sort((a, b) => a.priority - b.priority);

  let i = 0;

  for (const packageConfig of depsArray) {
    i++;
    const packageKey = packageConfig.packageKey;

    if (packageConfig.type === "npm") {
      console.log(
        `${chalk.reset.dim(`[${i}/${Object.keys(dependencies).length}]`)} ☕ skipping  ${chalk.blueBright.bold(
          packageKey
        )}, use package normally`
      );
      continue;
    }

    if (packageConfig.type === "local") {
      const current = process.cwd();
      try {
        const packageJsonDependencyInitial = require(process.cwd() + `/node_modules/${packageKey}/package.json`);
        process.chdir(packageConfig.path);
        const files = packlist.sync();
        const packageJsonDependency = require(process.cwd() + `/package.json`);
        console.log(
          `${chalk.reset.dim(`[${i}/${Object.keys(dependencies).length}]`)} 📦 add local ${chalk.blueBright.bold(
            packageKey
          )} ${chalk.white.bold(packageJsonDependencyInitial.version)} -> ${chalk[
            semver.lt(packageJsonDependency.version, packageJsonDependencyInitial.version) ? "red" : "green"
          ].bold(packageJsonDependency.version)}`
        );

        const dest = `${current}/node_modules/${packageKey}`;

        files.forEach((file, index, arr) => {
          child_process.exec(`cp -rf ${file.split("/")[0]} ${dest}`);
          if (program.opts().debug) {
            console.log(`      ${index === arr.length - 1 ? "╚" : "╠"}══ ${file}`);
          }
        });
        if (!program.opts().debug) {
          console.log(`      └─ ${files.length} files copied`);
        }

        if (semver.lt(packageJsonDependency.version, packageJsonDependencyInitial.version)) {
          console.log(`${chalk.yellow("warning")} You linked version are lower than installed in package.json`);
        }
        await exec(`touch ${dest}/.copyrc.txt`);

        process.chdir(current);
      } catch (e) {
        helpers.logError(`Can't install local dependency ${chalk.bold(packageKey)}`, e.message);
      }

      continue;
    }

    if (packageConfig.type === "link") {
      const currentDir = process.cwd();
      const packageJsonDependencyInitial = require(process.cwd() + `/node_modules/${packageKey}/package.json`);

      if (packageConfig.withDeps) {
        for (const dep of packageConfig.withDeps) {
          process.chdir(currentDir + `/node_modules/${dep}/`);
          const removeLinkPath = `${homedir}/.config/yarn/link/${dep.split("/")[0]}`;
          try {
            const file = await fsPromises.lstat(`${homedir}/.config/yarn/link/${dep}`);
            if (file.isSymbolicLink()) {
              await exec(`rm -rf ${removeLinkPath}`);
            }
          } catch (e) {}
          const { stdout, stderr } = await exec(`yarn link`);
          if (stderr) {
            if (stderr.includes(`"${dep}" registered`)) {
              helpers.logError(`package ${dep} already registered in another project ()`);
              console.log(`run 'rm -rf ${removeLinkPath}' manually`);
            } else {
              helpers.logError(stderr);
            }
            continue;
          }
        }
      }

      process.chdir(currentDir);

      const { stdout, stderr } = await exec(`yarn link ${packageKey}`);
      if (stderr) {
        helpers.logError(`Can't install link dependency ${chalk.bold(packageKey)}`, stderr.message);
        continue;
      }

      process.chdir(`./node_modules/${packageKey}`);
      const packageJsonDependency = require(process.cwd() + `/package.json`);
      console.log(
        `${chalk.reset.dim(`[${i}/${Object.keys(dependencies).length}]`)} 🔗 link with ${chalk.blueBright.bold(
          packageKey
        )} ${chalk.white.bold(packageJsonDependencyInitial.version)} -> ${chalk[
          semver.lt(packageJsonDependency.version, packageJsonDependencyInitial.version) ? "red" : "green"
        ].bold(packageJsonDependency.version)}`
      );

      if (packageConfig.withDeps) {
        let i = 0;
        for (const dep of packageConfig.withDeps) {
          const { stdout, stderr } = await exec(`yarn link ${dep}`);
          if (stderr) {
            helpers.logError(stderr);
            continue;
          }
          console.log(
            `      ${i === packageConfig.withDeps.length - 1 ? "└" : "├"}─ ${chalk.blueBright.bold(
              dep
            )} was linked with you current project`
          );
          i++;
        }
      }

      if (semver.lt(packageJsonDependency.version, packageJsonDependencyInitial.version)) {
        helpers.logWarning("You linked version are lower than installed in package.json");
      }

      process.chdir(currentDir);

      continue;
    }

    if (packageConfig.type === "git") {
      const currentDir = process.cwd();
      const packageJsonDependencyInitial = require(process.cwd() + `/node_modules/${packageKey}/package.json`);
      process.stdout.write(`installing ${chalk.blueBright.bold(packageKey)} from git...`);
      const { stdout, stderr } = await exec(`yarn add ${packageConfig.origin}#${packageConfig.head}`);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      if (stderr) {
        if (/^Error/g.test(stderr)) {
          if (program.opts().debug) {
            helpers.logError("something get wrong");
            helpers.logInfo(
              `try run command manually to check 'yarn add ${packageConfig.origin}#${packageConfig.head}'`
            );
            console.log(stderr);
          } else {
            helpers.logError("something get wrong, use --debug for full error");
            helpers.logInfo(
              `try run command manually to check 'yarn add ${packageConfig.origin}#${packageConfig.head}'`
            );
          }
        }
        console.log(
          `${chalk.reset.dim(`[${i}/${Object.keys(dependencies).length}]`)} 🐢 clone git ${chalk.blueBright.bold(
            packageKey
          )} ${chalk.white.bold(packageJsonDependencyInitial.version)} -> ${chalk.green.bold(packageConfig.head)}`
        );
        stderr.split("\n").map((string) => {
          if (string.startsWith("warning")) {
            helpers.logWarning(string.replace("warning", "").trim());
          }
        });

        continue;
      }
    } else {
      console.log(
        `${chalk.reset.dim(`[${i}/${Object.keys(dependencies).length}]`)} 🐢 clone git ${chalk.blueBright.bold(
          packageKey
        )} ${chalk.green.bold(packageConfig.head)} -> ${chalk.white.bold(packageJsonDependencyInitial.version)}`
      );
    }
  }
});

program.parse(process.argv);
