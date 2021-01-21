// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { i18nUtility } from "@scnode_core/utilities/i18nUtility";
// @end

type Characters = {
    numbers?  : string,   // Cadena de texto que representa numeros separados entre si por un espacio " "
    symbols?  : string,   // Cadena de texto que representa simbolos separados entre si por un espacio " "
    uppercase?: string,   // Cadena de texto que representa letras mayusculas separados entre si por un espacio " "
    lowercase?: string    // Cadena de texto que representa letras minusculas separados entre si por un espacio " "
};

type ConfigCharacters = {
    characters?: number,   // Cantidad numerica de caracteres de los cuales estara formada una cadena de texto
    numbers?   : 1 | 0,    // Valor binario donde 1 significa TRUE y 0 FALSE
    symbols?   : 1 | 0,    // Valor binario donde 1 significa TRUE y 0 FALSE
    uppercase? : 1 | 0,    // Valor binario donde 1 significa TRUE y 0 FALSE
    lowercase? : 1 | 0     // Valor binario donde 1 significa TRUE y 0 FALSE
}

class GeneralUtility {

  private config_characters_default: ConfigCharacters = {
      characters: 20,
      numbers   : 1,
      symbols   : 0,
      uppercase : 1,
      lowercase : 1,
  };

  private characters_default: Characters = {
      numbers  : '0 1 2 3 4 5 6 7 8 9',
      symbols  : '! @ # $ % & * ( ) _ - + = { [ ] } ; : < , > . ?',
      uppercase: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
      lowercase: 'a b c d e f g h i j k l m n o p q r s t u v w x y z',
  };

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
      // La estructura de un metodo debe ser la siguiente:
      public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

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
          hours: {value: 0, shortLabel: 'h', label: i18nUtility.i18nMessage('labels.time.hours')},
          minutes: {value: 0, shortLabel: 'm', label: i18nUtility.i18nMessage('labels.time.minutes')},
          seconds: {value: 0, shortLabel: 's', label: i18nUtility.i18nMessage('labels.time.seconds')}
      }

      if (h > 0) convert.hours.value = h
      if (m > 0) convert.minutes.value = m
      if (s > 0) convert.seconds.value = s

      return convert
  }

  /**
   * Metodo que permite generar una cadena de texto aleatoria basada en la configuracion proporcionada
   * @param [characters] Configuracion para la construccion de la cadena
   * @returns [string] Cadena de texto random (string)
   */
  public buildRandomChain = (characters: ConfigCharacters = {}) => {

      let characters_def = this.config_characters_default;

      Object.assign(characters_def,characters);

      let charactersEnd    = '';
      let charactersEndArr = [];
      let chain            = '';

      for (const prop in characters_def) {
          if (characters_def.hasOwnProperty(prop)) {
              const element = characters_def[prop];
              if (prop !== 'characters' && element === 1) {
                  charactersEnd += this.characters_default[prop] + ' ';
              }
          }
      }

      charactersEnd    = charactersEnd.trim();
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

      string_arr.forEach((item,i) => {
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
          origin.map((element,key) => {
              if (target.indexOf(element) === -1) {
                  target.push(element);
              }
          })
      } else if (typeof origin === 'object') {
          for (const key in origin) {
              if (origin.hasOwnProperty(key)) {
                  const element = origin[key];
                  if (target.hasOwnProperty(key)) {
                      target[key] = this.mergeJson(target[key],element)
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
      const reg = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
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
   * Metodo que retorna un slug generado de forma aleatoria
   * @returns
   */
  public generateSlug = (_string: string, complement: string = '') => {
      let str = _string + complement
      return str .toString()
      .normalize( 'NFD' )                   // split an accented letter in the base letter and the acent
      .replace( /[\u0300-\u036f]/g, '' )   // remove all previously split accents
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-'); ;
  }
}

export const generalUtility = new GeneralUtility();
export { GeneralUtility, ConfigCharacters }
