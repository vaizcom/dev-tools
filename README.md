# worx-dev-tools

1. Install `yarn add @worx-to/worx-dev-tools --save-dev`
2. Create configuration file `worx-dev-tools.json` and add into `.gitignore`

## Copy package tool

Easy copy your package to local projects. This command copy all [files you publish in npm package](https://docs.npmjs.com/cli/v7/commands/npm-publish#files-included-in-package) into
[paths](#copy-package-configuration) `node_module/{packageName}/` directory.

```bash
npx copy-packages
```

### Copy package configuration

Add section to `worx-dev-tools.json`

```json
{
  "copyPackages": {
    // Absolute paths to projects roots
    "paths": ["~/Projects/worx-app"]
  }
}
```

## Linker tool

Easy link local packages. This command is a enhancer for `yarn link`.

```bash
npx linker --help
npx linker unlink @package/name /* unlink package */
npx linker unlink --all         /* unlink all package */
npx linker check                /* check linked packages */
```
