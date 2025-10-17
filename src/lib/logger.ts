import chalk from "chalk";

type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

export class Logger {
  private level: LogLevel = "info";

  setLevel(level?: string) {
    if (!level) return;
    if (this.isValidLevel(level)) {
      this.level = level;
    } else {
      this.warn(`Unknown log level "${level}", defaulting to "${this.level}"`);
    }
  }

  error(message: unknown) {
    if (!this.shouldLog("error")) return;
    console.error(chalk.red("✖"), message);
  }

  warn(message: unknown) {
    if (!this.shouldLog("warn")) return;
    console.warn(chalk.yellow("⚠"), message);
  }

  info(message: unknown) {
    if (!this.shouldLog("info")) return;
    console.log(chalk.blue("ℹ"), message);
  }

  success(message: unknown) {
    if (!this.shouldLog("info")) return;
    console.log(chalk.green("✔"), message);
  }

  debug(message: unknown) {
    if (!this.shouldLog("debug")) return;
    console.log(chalk.gray("…"), typeof message === "string" ? message : JSON.stringify(message, null, 2));
  }

  isDebugEnabled() {
    return this.shouldLog("debug");
  }

  private shouldLog(level: LogLevel) {
    return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[this.level];
  }

  private isValidLevel(level: string): level is LogLevel {
    return level in LEVEL_PRIORITY;
  }
}
