import chalk from "chalk";

export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

export class Logger {
  #level: LogLevel = "info";

  setLevel(level?: LogLevel) {
    if (level) {
      this.#level = level;
    }
  }

  debug(message: string) {
    if (this.#shouldLog("debug")) {
      console.debug(chalk.gray(`[debug] ${message}`));
    }
  }

  info(message: string) {
    if (this.#shouldLog("info")) {
      console.log(chalk.cyan(message));
    }
  }

  warn(message: string) {
    if (this.#shouldLog("warn")) {
      console.warn(chalk.yellow(message));
    }
  }

  error(message: string) {
    if (this.#shouldLog("error")) {
      console.error(chalk.red(message));
    }
  }

  #shouldLog(level: LogLevel): boolean {
    const order: LogLevel[] = ["silent", "error", "warn", "info", "debug"];
    return order.indexOf(level) <= order.indexOf(this.#level) && this.#level !== "silent";
  }
}
