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

  public encrypt = (text, secret) => {
    const algorithm = 'aes-256-ctr';
    const key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
    const iv = crypto.randomBytes(16).toString('hex').slice(0, 16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = cipher.update(String(text), 'utf8', 'hex') + cipher.final('hex');
    return {
      iv: iv.toString('hex'),
      encryptedText: encrypted,
    };
  }

  public decrypt = (encryptedData, secret) => {
    const algorithm = 'aes-256-ctr';
    const key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      encryptedData.iv
    );

    let decrypted = decipher.update(encryptedData.encryptedText, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  }
}

export const cryptoUtility = new CryptoUtility();
export { CryptoUtility }
