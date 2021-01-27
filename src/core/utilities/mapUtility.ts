// @import_dependencies_node Import libraries
// @end

class MapUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite ejecutar la funcion map de javascript de forma asincrona
   * @param fn Mapa de javascript que se desea ejecutar de forma asincrona
   * @returns
   */
  public mapAsync = (fn) => {
    return Promise.all(fn)
  }

  /**
   * Metodo que permite reordenar un array de forma aleatoria
   * @param array Array a reorganizar
   * @returns
   */
  public shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Metodo que permite eliminar duplicados de un array
   * @param data Array al que se eliminaran duplicados
   * @returns
   */
  public removeDuplicated = (data: Array<any>) => {
    const result = data.reduce((acc,item)=>{
      if(!acc.includes(item)){
        acc.push(item);
      }
      return acc;
    },[])
    return result
  }
}

export const mapUtility = new MapUtility();
export { MapUtility }
