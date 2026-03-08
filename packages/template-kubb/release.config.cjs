const base = require("../../release.base.cjs");

module.exports = {
  ...base,
  extends: ["semantic-release-monorepo"],
  tagFormat: "template-kubb-v${version}"
};
