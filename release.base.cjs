const path = require("node:path");

const githubPlugin = path.join(
  __dirname,
  "scripts",
  "semantic-release-github-no-fail.mjs"
);

module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/npm",
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
