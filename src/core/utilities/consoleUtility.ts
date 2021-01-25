// @import_dependencies_node Import libraries
import chalk from 'chalk';
import * as figlet from 'figlet';
// @end

type FontOptions = {
  font?            : string,
  horizontalLayout?: "default" | "full" | "fitted" | "controlled smushing" | "universal smushing",
  verticalLayout?  : "default" | "full" | "fitted" | "controlled smushing" | "universal smushing",
}

class ConsoleUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  /**
   * Metodo que permite generar un banner por consola
   * @param banner_text Texto a mostrar en consola como encabezado
   * @param [options] Parametros configurables de la libreria "figlet"
   */
  public createBanner = (banner_text, options = {}) => {
    let options_default = {};

    Object.assign(options_default, options);

    console.log(
      chalk.red   (
        figlet.textSync(banner_text, options_default)
      )
    );
  }

  /**
   * Metodo que permite mostrar un mensaje por consola formateado para error
   * @param message Mensaje a mostrar
   * @param prefix Prefijo para adjuntar al mensaje
   */
  public showErrorConsole = (message, prefix: string = '') => {
    let console_message = '';
    if (prefix !== '') {
      console_message += chalk.red(prefix + ' - ');
    } else {
      console_message += chalk.red('Error - ');
    }
    console_message += message;
    console.log(console_message);
  }

  /**
   * Metodo que permite mostrar un mensaje por consola formateado para success
   * @param message Mensaje a mostrar
   * @param prefix Prefijo para adjuntar al mensaje
   */
  public showSuccessConsole = (message, prefix: string = '') => {
    let console_message = '';
    if (prefix !== '') {
      console_message += chalk.green(prefix + ' - ');
    } else {
      console_message += chalk.green('Success - ');
    }
    console_message += message;
    console.log(console_message);
  }

}

export const consoleUtility = new ConsoleUtility();
export { ConsoleUtility, FontOptions }
