const chalk = require('chalk');
const ora = require('ora');

class Logger {
  constructor() {
    this.spinner = null;
  }

  info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message) {
    console.log(chalk.green('✓'), message);
  }

  error(message) {
    console.log(chalk.red('✗'), message);
  }

  warning(message) {
    console.log(chalk.yellow('⚠'), message);
  }

  startSpinner(message) {
    this.spinner = ora(message).start();
  }

  updateSpinner(message) {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  succeedSpinner(message) {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  failSpinner(message) {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  stopSpinner() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  header(message) {
    console.log('\n' + chalk.bold.underline(message) + '\n');
  }

  section(message) {
    console.log('\n' + chalk.bold(message));
  }

  code(message) {
    console.log(chalk.gray(message));
  }

  url(message) {
    console.log(chalk.cyan.underline(message));
  }
}

module.exports = new Logger();