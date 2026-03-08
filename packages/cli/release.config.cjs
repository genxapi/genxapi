const base = require("../../release.base.cjs");

module.exports = {
  ...base,
  tagFormat: "cli-v${version}"
};
