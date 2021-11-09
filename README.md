# worx-dev-tools

1. Install `yarn add @worx-to/worx-dev-tools --save-dev`
2. Create configuration file `worx-dev-tools.json` and add into `.gitignore`

> If you find some errors or [grammatical stupidity](https://i.kym-cdn.com/entries/icons/facebook/000/001/639/grammarnazi.jpg) (even in this block) please open an issue
> or if you need to help with setup `worx-dev-tools.json` please ask freely

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
npx linker --help               /* check more options */
npx linker unlink @package/name /* unlink package */
npx linker unlink --all         /* unlink all package */
npx linker unlink --skip-instal /* skip yarn install --force */
npx linker unlink --help        /* check more options */
npx linker check                /* check linked packages */
```

## Clean types

Some times you may have trash types into your `/node_modules/@types` folder. It happens when
you use packages with different version of the same lib (e.g. react). To avoid typescript errors use `clean-types`
Good case to use it after [install packages](https://docs.npmjs.com/cli/v7/using-npm/scripts#pre--post-scripts).

```bash
npx clean-types
```

### Clean types configuration

Add section to `worx-dev-tools.json`

```json
{
  "trashTypes": ["hoist-non-react-statics", "react-redux"]
}
```

## Dependency

```bash
npx dev-dependencies
```

### Dependency configuration

Add section `dependencies` section to `worx-dev-tools.json`

### One dependency config

- **type** of installation

  - `local` means that you want to copy dependency from you folder as normal npm package
  - `git` means that you want to install dependency from repository
  - `link` means that you want to install dependency as link using 'yarn link'
  - `npm` means that you want to install dependency normally. It just for skipping and saving your config for next use

- **path** relative path to your local package. May effect only for `local` type
- **origin** git repository origin (with protocol). May effect only for `git` type
- **head** choose one of _branch/commitHash/tag_ in repo. May effect only for `git` type

```json
{
  "dependencies": {
    "@worx-to/shared": {
      "type": "local",
      "path": "../worx-shared"
    },
    "@worx-to/worx-dev-tools": {
      "type": "git",
      "origin": "git+ssh://git@github.com:worx-to/worx-dev-tools.git",
      "head": "master"
    },
    "@worx-to/icons": {
      "type": "link"
    },
    "@worx-to/ui": {
      "type": "npm",
      // you can save non-affect props for further use
      "path": "../worx-ui",
      "origin": "git+ssh://git@github.com:worx-to/worx-ui.git",
      "head": "develop"
    }
  }
}
```
