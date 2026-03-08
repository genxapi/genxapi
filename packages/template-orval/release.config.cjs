const base = require("../../release.base.cjs");

module.exports = {
  ...base,
  tagFormat: "template-orval-v${version}"
};
