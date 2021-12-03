module.exports = {
  name: `plugin-clean-setup`,
  factory: (require) => {
    const { Command, Option } = require(`clipanion`);

    const t = require(`typanion`);

    class CleanCommand extends Command {
      static paths = [[`clean`]];
      i = Option.Boolean(`-i,--install`, false, {
        required: false,
        description: `install dependencies after cleaning`,
      });

      static usage = Command.Usage({
        description: `Clean node_modules and yarn.lock`,
        details: ``,
        examples: [[`Clean your working directory from yarn.lock and node_modules with a snap`, `yarn clean`]],
      });

      async execute() {
        await this.cli.run(["exec", "rm  yarn.lock && rm -rf .yarn/cache && rm -rf ./node_modules"]);
        if (this.i) {
          await this.cli.run(["install"]);
        }
        return 0;
      }
    }

    return {
      commands: [CleanCommand],
    };
  },
};
