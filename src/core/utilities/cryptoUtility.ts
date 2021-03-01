// @import_dependencies_node Import libraries
const crypto = require('crypto')
// @end

class CryptoUtility {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite encriptar una cadena de texto en codigo MD5
   * @param string Cadena a encriptar
   * @returns
   */
  public md5 = (string: string) => {
    return crypto.createHash('md5').update(string).digest("hex")
  }
}

export const cryptoUtility = new CryptoUtility();
export { CryptoUtility }
