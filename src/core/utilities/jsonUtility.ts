// @import_dependencies_node Import libraries
// @end

class JsonUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que convierte un Objeto JSON a un string, anidando sus propiedades en formato objectNotation
   * @param object Objeto que se desea convertir
   * @param [string] Cadena de texto donde se van a unir las propiedades
   * @param [prefix] El prefijo normalmente sera una propiedad padre del objeto
   * @param [join] Punto de anclaje de los elementos del JSON
   * @returns
   */
  public convertJsonToString = (object, string: string = '', prefix: string = '', join: string = '.') => {
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        const element = object[key];
        if (typeof element === 'object' && !Array.isArray(element) && Object.values(element).length > 0) {
          let newPrefix = (prefix !== '') ? `${prefix}${join}${key}` : key
          string = this.convertJsonToString(element, string, newPrefix, join)
        } else {
          if (prefix !== '') {
            string += `${prefix}${join}${key} `
          } else {
            string += `${key} `
          }
        }
      }
    }
    return string
  }

  /**
   * Metodo que convierte un Objeto JSON a un Array de string, anidando sus propiedades en formato objectNotation dentro de un array
   * @param json Objeto que se desea convertir
   * @param [arr] Array donde se van a unir las propiedades
   * @param [prefix] El prefijo normalmente sera una propiedad padre del objeto
   * @param [join] Punto de anclaje de los elementos del JSON
   * @returns
   */
  public convertJsonToArrayString = (json, arr: Array<any>, prefix: string = '', join: string = '.') => {
    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        const element = json[key];
        if (typeof element === 'object' && !Array.isArray(element) && Object.values(element).length > 0) {
          let newPrefix = (prefix !== '') ? `${prefix}${join}${key}` : key
          arr = this.convertJsonToArrayString(element, arr, newPrefix, join)
        } else {
          if (prefix !== '') {
            arr.push(`${prefix}${join}${key}`)
          } else {
            arr.push(`${key}`)
          }
        }
      }
    }
    return arr
  }

  /**
   * Metodo que convierte un string en formato dotNotation a un objeto JSON y asigna un valor a la ultima propiedad
   * @param str Cadena de texto a convertir
   * @param object Objeto donde se asignaran los items
   * @param [value] Valor que se desea asignar
   */
  public convertStringToJson = (str: string, object: any, value: any = null) => {

    const items = str.split(".") // split on dot notation

    //  loop through all nodes, except the last one
    for(var i = 0; i < items.length - 1; i ++) {
      if (!object[items[i]]) {
        object[items[i]] = {} // create a new element inside the reference
      }
      object = object[items[i]] // shift the reference to the newly created object
    }
    object[items[items.length - 1]] = value // apply the final value

  }

  /**
   * Metodo que busca (objectNotation) dentro de un objeto JSON la estructura proporcionada (EJ: key_one.key_two... | key_one)
   * @param key_message Cadena de texto separada por . que se desea buscar dentro de un objeto JSON
   * @param json Objeto JSON sobre el cual se desea buscar
   * @returns [json] Objeto JSON que contiene el valor encontrado | undefined
   */
  public searchInJsonRecursive(key_message: string, json: any = {}) {
    const key_arr  = key_message.split('.');
    let json_aux = json;
    let found    = true;
    let response = undefined;

    for (const key in key_arr) {
      if (key_arr.hasOwnProperty(key)) {
        const element = key_arr[key];
        if (json_aux && json_aux.hasOwnProperty(element)) {
          json_aux = json_aux[element];
        } else {
          found = false;
        }
      }
    }

    if (found === true) {
      return json_aux
    }
    return response;
  }

  /**
   * Metodo que permite clonar un objeto de forma recursiva y profunda
   * @param object Objeto a clonar
   * @returns
   */
  public deepClone = (object) => {

    let clone = {}
    for (const key in object) {
      const value = object[key]
      if (typeof(value) !== 'object' || value === null) {
        clone[key] = value
      } else {
        clone[key] = this.deepClone(value)
      }
    }
    return clone
  }

}

export const jsonUtility = new JsonUtility();
export { JsonUtility }
