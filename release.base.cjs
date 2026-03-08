const path = require("node:path");

const npmPlugin = require.resolve("@semantic-release/npm");
const packageScopedPlugin = path.join(
  __dirname,
  "scripts",
  "semantic-release-package-scoped.mjs"
);
const githubPlugin = path.join(
  __dirname,
  "scripts",
  "semantic-release-github-no-fail.mjs"
);

module.exports = {
  branches: ["main"],
  plugins: [
    packageScopedPlugin,
    [
      npmPlugin,
      {
        npmPublish: true
      }
    ],
    [
      githubPlugin,
      {
        successComment: false,
        failComment: false
      }
    ]
  ]
};
