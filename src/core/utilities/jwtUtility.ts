// @import_dependencies_node Import libraries
import * as jwt from 'jwt-simple';
import moment from 'moment';
import { Request } from 'express';
// @end

// @import_config_files Import config files
import { jwt_secret, jwt_exp } from "@scnode_core/config/globals";
import * as env from "@scnode_config/env.json";
// @end

type JwtExpStructure = {
    amount? : number,   // Cantidad de tiempo
    unity?  : string,   // Unidad hours, minutes, seconds
};

class JwtUtility {

    /*===============================================
    =            Estructura de un metodo            =
    ================================================
        // La estructura de un metodo debe ser la siguiente:
        public methodName = () => {}
    /*======  End of Estructura de un metodo  =====*/

    constructor () {}

    /**
     * Metodo que permite establecer la llave JWT segun la peticion
     * @param req Objeto de clase Express
     * @returns [string] Llave secreta
     */
    public getJwtSecret = (req: Request | null) => {

        let secret = jwt_secret;
        if (req && req.headers["source"]) {
            const source = req.headers["source"].toString();
            if (env.hasOwnProperty('jwt_secret') && env["jwt_secret"].hasOwnProperty(source)) {
                secret = env["jwt_secret"][source];
            }
        }
        return secret;
    }

    /**
     * Metodo que permite decodificar un token JWT
     * @param token Token JWT a decodificar
     * @param secret Llave de encriptacion
     * @returns  [array] Array con los datos decodificados del token
     */
    public jwtDecode = (token: any, secret: string) => {
        return jwt.decode(token, secret);
    }

    /**
     * Metodo que permite crear un token de autenticación basado en el estandar JWT
     * @param sub Identificador principal del token
     * @param secret Llave de encriptacion
     * @param [token_data] Parametros opcionales que se añaden al token
     * @returns [string] Token JWT
     */
    public createToken = (sub, secret: string, token_data: any = {}, new_jwt_exp: JwtExpStructure = {}) => {

        let jwt_exp_config = jwt_exp;

        if (new_jwt_exp.hasOwnProperty('amount')) jwt_exp_config.amount = new_jwt_exp.amount;
        if (new_jwt_exp.hasOwnProperty('unity')) jwt_exp_config.unity = new_jwt_exp.unity;

        let payload = {
            sub   : sub,
            iat   : moment().unix(),
            exp   : moment().add(jwt_exp_config.amount,<moment.unitOfTime.DurationConstructor> jwt_exp_config.unity).unix()
        };

        Object.assign(payload,token_data);

        return jwt.encode(payload, secret);
    }

    /**
     * Metodo que permite refrescar (actualizar) un token basado en el estandar JWT
     * @param token JWT token
     * @param secret Llave de encriptacion
     * @returns [string] Token JWT
     */
    public refreshToken = (token, secret: string, additional_data: any = {}, new_jwt_exp: JwtExpStructure = {}) => {
        let jwt_exp_config = jwt_exp;

        if (new_jwt_exp.hasOwnProperty('amount')) jwt_exp_config.amount = new_jwt_exp.amount;
        if (new_jwt_exp.hasOwnProperty('unity')) jwt_exp_config.unity = new_jwt_exp.unity;

        let payload = this.jwtDecode(token, secret);

        if (!payload.hasOwnProperty('iat')) payload['iat'] = "";
        if (!payload.hasOwnProperty('exp')) payload['exp'] = "";

        payload['iat'] = moment().unix();
        payload['exp'] = moment().add(jwt_exp_config.amount,<moment.unitOfTime.DurationConstructor> jwt_exp_config.unity).unix();

        Object.assign(payload,additional_data);

        return jwt.encode(payload, secret);
    }
}

export const jwtUtility = new JwtUtility();
export { JwtUtility, JwtExpStructure }
