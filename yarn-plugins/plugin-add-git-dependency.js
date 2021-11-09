module.exports = {
  name: `plugin-add-git-dependency`,
  factory: (require) => {
    const { Command, Option, UsageError } = require(`clipanion`);
    const { Configuration, Project } = require("@yarnpkg/core");

    const t = require(`typanion`);

    class GitAddCommand extends Command {
      static paths = [[`git-add`]];

      static usage = Command.Usage({
        description: `Git one off your dependency from git repo`,
        details: ``,
        examples: [[`Install react from github repository with tag`, `yarn git-add react v17.0.2`]],
      });

      a = Option.String({ validator: t.isString() });
      b = Option.String({ validator: t.isString() });

      async execute() {
        const configuration = await Configuration.find(this.context.cwd, this.context.plugins);
        const { workspace } = await Project.find(configuration, this.context.cwd);
        const remoteUrl = workspace.manifest.raw.gitRemotes[this.a];
        if (!remoteUrl) {
          throw new UsageError(`Remote for ${this.a} didn't find. Add gitRemote first`);
        }
        await this.cli.run(["add", `${this.a}@${remoteUrl}#${this.b}`]);

        return 0;
      }
    }

    return {
      commands: [GitAddCommand],
    };
  },
};
