import { type Config } from "@orval/core";

const packageName = "__PACKAGE_NAME__";

const config: Config = {
  nestjs_api: {
    output: {
      mode: "__ORVAL_MODE__",
      workspace: "__ORVAL_WORKSPACE__",
      target: "__ORVAL_TARGET__",
      schemas: "model",
      client: "__ORVAL_CLIENT__",
      baseUrl: "__ORVAL_BASE_URL__",
      mock: __ORVAL_MOCK__,
      prettier: __ORVAL_PRETTIER__,
    },
    input: {
      target: "__SWAGGER_PATH__",
    },
  },
};

void packageName;

export default config;
