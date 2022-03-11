// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end

type Characters = {
  numbers?: string,   // Cadena de texto que representa numeros separados entre si por un espacio " "
  symbols?: string,   // Cadena de texto que representa simbolos separados entre si por un espacio " "
  uppercase?: string,   // Cadena de texto que representa letras mayusculas separados entre si por un espacio " "
  lowercase?: string    // Cadena de texto que representa letras minusculas separados entre si por un espacio " "
};

type ConfigCharacters = {
  characters?: number,   // Cantidad numerica de caracteres de los cuales estara formada una cadena de texto
  numbers?: 1 | 0,    // Valor binario donde 1 significa TRUE y 0 FALSE
  symbols?: 1 | 0,    // Valor binario donde 1 significa TRUE y 0 FALSE
  uppercase?: 1 | 0,    // Valor binario donde 1 significa TRUE y 0 FALSE
  lowercase?: 1 | 0     // Valor binario donde 1 significa TRUE y 0 FALSE
}

class GeneralUtility {

  private config_characters_default: ConfigCharacters = {
    characters: 20,
    numbers: 1,
    symbols: 0,
    uppercase: 1,
    lowercase: 1,
  };

  private characters_default: Characters = {
    numbers: '0 1 2 3 4 5 6 7 8 9',
    symbols: '! @ # $ % & * ( ) _ - + = { [ ] } ; : < , > . ?',
    uppercase: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
    lowercase: 'a b c d e f g h i j k l m n o p q r s t u v w x y z',
  };

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  /**
   * Metodo que permite formatear un numero y colocar la cantidad de ceros solicitada a la izquierda
   * @param number Numero a formatear
   * @param width Tamaño del formato
   * @returns
   */
  public formatNumberWithZero = (number, width) => {

    const numberOutput = Math.abs(number); /* Valor absoluto del número */
    const length = number.toString().length; /* Largo del número */
    const zero = "0"; /* String de cero */

    if (width <= length) {
      if (number < 0) {
        return ("-" + numberOutput.toString());
      } else {
        return numberOutput.toString();
      }
    } else {
      if (number < 0) {
        return ("-" + (zero.repeat(width - length)) + numberOutput.toString());
      } else {
        return ((zero.repeat(width - length)) + numberOutput.toString());
      }
    }
  }

  /**
   * Metodo que permite formatear segundos a horas, minutos, segundos
   * @param seconds Cantidad de segundos a convertir
   * @returns
   */
  public convertSeconds = (seconds) => {

    seconds = Number(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 3600 % 60);

    let convert = {
      hours: { value: 0, shortLabel: 'h', label: i18nUtility.i18nMessage('labels.time.hours') },
      minutes: { value: 0, shortLabel: 'm', label: i18nUtility.i18nMessage('labels.time.minutes') },
      seconds: { value: 0, shortLabel: 's', label: i18nUtility.i18nMessage('labels.time.seconds') }
    }

    if (h > 0) {
      convert.hours.value = h
      if (h === 1) convert.hours.label = i18nUtility.i18nMessage('labels.time.hour')
    }
    if (m > 0) {
      convert.minutes.value = m
      if (m === 1) convert.hours.label = i18nUtility.i18nMessage('labels.time.minute')
    }
    if (s > 0) {
      convert.seconds.value = s
      if (s === 1) convert.hours.label = i18nUtility.i18nMessage('labels.time.second')
    }

    return convert
  }

  /**
   * Metodo que permite generar una cadena de texto aleatoria basada en la configuracion proporcionada
   * @param [characters] Configuracion para la construccion de la cadena
   * @returns [string] Cadena de texto random (string)
   */
  public buildRandomChain = (characters: ConfigCharacters = {}) => {

    let characters_def = this.config_characters_default;

    Object.assign(characters_def, characters);

    let charactersEnd = '';
    let charactersEndArr = [];
    let chain = '';

    for (const prop in characters_def) {
      if (characters_def.hasOwnProperty(prop)) {
        const element = characters_def[prop];
        if (prop !== 'characters' && element === 1) {
          charactersEnd += this.characters_default[prop] + ' ';
        }
      }
    }

    charactersEnd = charactersEnd.trim();
    charactersEndArr = charactersEnd.split(' ');

    for (let i = 0; i < characters_def.characters; i++) {
      chain = chain + charactersEndArr[Math.floor(Math.random() * charactersEndArr.length)];
    }

    return chain;
  }

  /**
   * Metodo que convierte el valor en bytes a su correspondiente formato
   * @param bytes Valor en byte(B) a convertir
   * @param decimals Cantidad de decimales permitido para la conversion
   * @return [string] Cadena de texto (string)
   */
  public byteCalculator = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Metodo que convierte a mayuscula la primera letra de cada palabra de un string
   * @param string Cadena de texto a convertir
   * @param [first_minuscule] Valor binario que establece si la primera letra del string se quedara en minuscula
   * @param [conector] Conector que puede unir a la cadena de texto y por el cual se va a separar para encontrar las palabras
   * @param [join] Conector que puede unir la cadena de texto una vez convertido
   * @returns [string] Cadena de texto convertida
   */
  public upperCaseString = (string: string, first_minuscule: boolean = false, conector: string = '-', join: string = '') => {

    string = string.toLowerCase(); // Convertir a minuscula

    let string_arr = string.split(conector); // Separar segun conector

    string_arr.forEach((item, i) => {
      let char = item.charAt(0).toUpperCase() + item.slice(1);
      if (first_minuscule === true) {
        if (i == 0) {
          char = item.charAt(0).toLowerCase() + item.slice(1);
        }
      }
      string_arr[i] = char;
    });

    return string_arr.join(join);
  }

  /**
   * Metodo que un convierte un conector por otro
   * @param string Cadena de texto a convertir
   * @param [conector] Conector que une la cadena
   * @param [join] Conector que unira la cadena
   */
  public changeStringConnector = (string: string, conector: string = '-', join: string = '') => {
    const regex = new RegExp(conector, 'g');
    const string_arr = string.replace(regex, join)
    return string_arr
  }

  /**
   * Metodo que permite integrar dos objectos JSON
   * @param target JSON sobre el cual se desea agregar la información
   * @param origin JSON desde el cual se desea obtener la información
   * @returns
   */
  public mergeJson = (target, origin) => {

    if (Array.isArray(origin)) {
      origin.map((element, key) => {
        if (target.indexOf(element) === -1) {
          target.push(element);
        }
      })
    } else if (typeof origin === 'object') {
      for (const key in origin) {
        if (origin.hasOwnProperty(key)) {
          const element = origin[key];
          if (target.hasOwnProperty(key)) {
            target[key] = this.mergeJson(target[key], element)
          } else {
            target[key] = element;
          }
        }
      }
    } else {
      target = origin;
    }
    return target;
  }

  /**
   * Metodo que valida la estructura de un email y verifica si es correcta
   * @param email Email a validar
   * @returns  [boolean] Booleano
   */
  public validateEmailFormat = (email) => {
    let isValid = false;
    const reg = /^(([^<>()[\]\.,;:ñÑ\s@\"]+(\.[^<>()[\]\.,;:ñÑ\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    if (reg.test(email) == true) isValid = true;

    return isValid;
  }

  /**
   * Metodo que genera un numero entero aleatorio entre un minimo y un maximo
   * @param min Entero minimo para generar el numero aleatorio
   * @param max Entero maximo para generar el numero aleatorio
   * @returns
   */
  public rand = (min = 0, max = Number.MAX_SAFE_INTEGER) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Metodo que retorna el timestamp actual
   * @returns
   */
  public time = () => {
    return Math.floor(new Date().getTime() / 1000)
  }
  /**
   * Método que retorna una fecha en formato Unix
   * @param dateToChange
   * @returns
   */

  public unixTime = (dateToChange: string) => {
    return Math.floor(Date.parse(dateToChange) / 1000.0)
  }

  public unixTimeOffset = (dateToChange: string, hours: number, endOfDay: boolean = false) => {
    let interval = 0;
    if (endOfDay) {
      interval = 60 * 60 * 24 - 1;
    }
    return Math.floor(Date.parse(dateToChange) / 1000.0) + hours * 3600 + interval
  }

  public unixTimeToString = (unixTime: number) => {

    return new Date(unixTime * 1000).toISOString()
  }

  /*
    * Método que normaliza el nombre de un usuario a formato Moodle-CampusDigital:
    * todos los caracteres deben ir en minúsculas
    * si existen espacios, se reemplazan por '_'
    * si existen puntos, se eliminan
  */
  public normalizeUsername = (username: string) => {
    return username.trim().toLowerCase().replace(/ /g, "_").replace(/\./g, "").replace(/\,/g, "");
  }

    /*
    * Método que elimina caracteres en el nombre de un usuario :
    * si existen espacios, se eliminan
    * Si existen caracteres acentuados, se reemplaza por su vocal sin acento
    * Si existen Ñ, se convierte a N
  */
  public normalizeFullName = (firstname: string, lastname: string) => {
    return firstname.trim().replace(/ /g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    + lastname.trim().replace(/ /g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /*
    * Método que normaliza el número de documento de identidad a formato Moodle-CampusDigital:
    * si existen puntos, se eliminan
  */

  public normalizeDocumentID = (username: string) => {
    return username.trim().replace(/\./g, "");
  }

  /*
  * Método que normaliza el email de un usuario :
  * todos los caracteres deben ir en minúsculas
  * se eliminan los espacios iniciales o finales
  * se eliminan los posibles saltos de línea
*/
  public normalizeEmail = (email: string) => {
    return email.trim().toLowerCase().replace(/(\r\n|\n|\r)/gm, "");
  }

  // public timeUnix = (date: string) => {
  //   return Math.floor(Date.parse(date) / 1000.0);
  // }

  /**
   * Metodo que retorna un slug generado de forma aleatoria
   * @returns
   */
  public generateSlug = (_string: string, complement: string = '') => {
    let str = _string + complement
    return str.toString()
      .normalize('NFD')                   // split an accented letter in the base letter and the acent
      .replace(/[\u0300-\u036f]/g, '')   // remove all previously split accents
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');;
  }

  /**
   * Metodo que permite calcular la funcion gamma
   * @param number Numero para calcular la funcion
   * @returns
   */
  public gamma = (number: number) => {

    if (number <= 0.0) return null;

    number = Math.round((number * 100)) / 100;

    /*==================================================================================================================
    =            Cargando algunos valores por defecto de la función para evitar procesamientos innecesarios            =
    ==================================================================================================================*/

    if (number == 2.00) {
      return 1;
    } else if (number == 2.01) {
      return 1.004269;
    } else if (number == 2.02) {
      return 1.008621;
    } else if (number == 2.03) {
      return 1.013056;
    } else if (number == 2.04) {
      return 1.017575;
    } else if (number == 2.05) {
      return 1.022179;
    } else if (number == 2.06) {
      return 1.026868;
    } else if (number == 2.07) {
      return 1.031642;
    } else if (number == 3.00) {
      return 2;
    } else if (number == 3.01) {
      return 2.018581;
    } else if (number == 3.02) {
      return 2.037414;
    } else if (number == 3.03) {
      return 2.056504;
    } else if (number == 3.05) {
      return 2.075854;
    } else if (number == 3.06) {
      return 2.115348;
    } else if (number == 3.07) {
      return 2.135500;
    }

    /*=====  End of Cargando algunos valores por defecto de la función para evitar procesamientos innecesarios  ======*/


    // Split the function domain into three intervals:
    // (0, 0.001), [0.001, 12), and (12, infinity)

    // ###########################################################################
    // First interval: (0, 0.001)

    // For small x, 1/Gamma(x) has power series x + gamma x^2  - ...
    // So in this range, 1/Gamma(x) = x + gamma x^2 with error on the order of x^3.
    // The relative error over this interval is less than 6e-7.

    const gamma = 0.577215664901532860606512090; // Euler's gamma constant

    if (number < 0.001) {
      return 1.0 / (number * (1.0 + gamma * number));
    }

    // ###########################################################################
    // Second interval: [0.001, 12)

    if (number < 12.0) {
      // The algorithm directly approximates gamma over (1,2) and uses
      // reduction identities to reduce other arguments to this interval.

      let y = number;
      let n = 0;
      const arg_was_less_than_one = (y < 1.0);

      // Add or subtract integers as necessary to bring y into (1,2)
      // Will correct for this below

      if (arg_was_less_than_one) {
        y += 1.0;
      } else {
        n = Math.floor(y) - 1;  // will use n later
        y -= n;
      }

      // numerator coefficients for approximation over the interval (1,2)
      const p = [
        -1.71618513886549492533811E+0,
        2.47656508055759199108314E+1,
        -3.79804256470945635097577E+2,
        6.29331155312818442661052E+2,
        8.66966202790413211295064E+2,
        -3.14512729688483675254357E+4,
        -3.61444134186911729807069E+4,
        6.64561438202405440627855E+4
      ]

      // denominator coefficients for approximation over the interval (1,2)
      const q = [
        -3.08402300119738975254353E+1,
        3.15350626979604161529144E+2,
        -1.01515636749021914166146E+3,
        -3.10777167157231109440444E+3,
        2.25381184209801510330112E+4,
        4.75584627752788110767815E+3,
        -1.34659959864969306392456E+5,
        -1.15132259675553483497211E+5
      ]

      let num = 0.0;
      let den = 1.0;

      let z = y - 1;
      for (let index = 0; index < 8; index++) {
        num = (num + p[index]) * z;
        den = den * z + q[index];

      }

      let result = num / den + 1.0;

      // Apply correction if argument was not initially in (1,2)
      if (arg_was_less_than_one) {
        // Use identity gamma(z) = gamma(z+1)/z
        // The variable "result" now holds gamma of the original y + 1
        // Thus we use y-1 to get back the orginal y.
        result /= (y - 1.0);
      } else {
        // Use the identity gamma(z+n) = z*(z+1)* ... *(z+n-1)*gamma(z)
        for (let index = 0; index < n; index++) {
          result *= y++;
        }
      }

      return result;
    }

    // ###########################################################################
    // Third interval: [12, infinity)

    if (number > 171.624) {
      // Correct answer too large to display.
      return Number.POSITIVE_INFINITY;
    }

    return Math.exp(this.logGamma(number))
  }

  /**
   * Metodo que permite calcular el logaritmo de gamma
   * @param number Numero a calcular
   * @returns
   */
  private logGamma = (number: number) => {

    if (number <= 0.0) return null

    if (number < 12.0) {
      return Math.log(Math.abs(this.gamma(number)))
    }

    // Abramowitz and Stegun 6.1.41
    // Asymptotic series should be good to at least 11 or 12 figures
    // For error analysis, see Whittiker and Watson
    // A Course in Modern Analysis (1927), page 252

    const c = [
      1.0 / 12.0,
      -1.0 / 360.0,
      1.0 / 1260.0,
      -1.0 / 1680.0,
      1.0 / 1188.0,
      -691.0 / 360360.0,
      1.0 / 156.0,
      -3617.0 / 122400.0
    ]

    const z = 1.0 / (number * number);
    let sum = c[7];
    for (let index = 6; index >= 0; index--) {
      sum *= z;
      sum += c[index];
    }
    const series = sum / number;

    const halfLogTwoPi = 0.91893853320467274178032973640562;
    const logGamma = (number - 0.5) * Math.log(number) - number + halfLogTwoPi + series;
    return logGamma;
  }

  /**
   * @INFO Obtener duración con el formato
   * @param seconds
   */
  public getDurationFormated = (seconds: number, format: 'short' | 'large' = 'short') => {
    const hours = Math.trunc(seconds / 3600)
    const minutes = Math.trunc((seconds - (hours * 3600)) / 60)
    const seconds2 = Math.trunc(seconds - (hours * 3600) - (minutes * 60))
    let response: string = ''
    if (hours) {
      response = `${response} ${hours}${(format === 'short') ? 'h' : ' Horas'}`
    }
    if (minutes) {
      response = `${response} ${minutes}${(format === 'short') ? 'm' : ' Minutos'}`
    }
    if (seconds2) {
      response = `${response} ${seconds2}${(format === 'short') ? 's' : ' Segundos'}`
    }
    return response.trim();
  }

  /**
  * @INFO Obtener duración con el formato
  * @param seconds
  */
  public getDurationFormatedForCertificate = (seconds: number) => {
    const hours = Math.trunc(seconds / 3600)
    const minutes = Math.trunc((seconds - (hours * 3600)) / 60)
    const seconds2 = Math.trunc(seconds - (hours * 3600) - (minutes * 60))
    let response: string = ''
    if (hours) {
      if (hours == 1)
        response = `${response} ${hours} hora`
      else
        response = `${response} ${hours} horas`
    }
    return response.trim();
  }


  /**
  * @INFO Obtener duración con el formato
  * @param seconds
  */
  public getDurationFormatedForVirtualStore = (seconds: number) => {
    const hours = Math.trunc(seconds / 3600)
    return hours;
  }

  /**
   * @INFO Obtener segundos de texto
   * @param inputValue
   */
  public getSecondsFromDuration = (inputValue: string) => {
    const auxVector = inputValue.split(' ')
    let seconds: number = 0
    if (auxVector.length) {
      auxVector.forEach(item => {
        if (item.includes('h')) {
          const hours = Number(item.replace('h', ''))
          seconds += hours * 3600
        } else if (item.includes('m')) {
          const minutes = Number(item.replace('m', ''))
          seconds += minutes * 60
        } else if (item.includes('s')) {
          seconds += Number(item.replace('s', ''))
        }
      })
    }
    return seconds
  }


  public stringIsNullOrEmpty = (value: string) => {
    if (value === null) {
      return true;
    }
    else {
      if (value.trim().length === 0) {
        return true;
      }

      return false;
    }
  }

  public checkHexadecimalCode = (toCheck: string) => {
    var re = /\b[0-9A-Fa-f]{8,24}/;
    if (re.test(toCheck)) {
      return true;
    }
    else {
      return false;
    }
  }

}

export const generalUtility = new GeneralUtility();
export { GeneralUtility, ConfigCharacters }
