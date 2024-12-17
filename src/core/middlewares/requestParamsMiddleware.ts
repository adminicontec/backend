// @import_dependencies_node Import libraries
import { Request, Response, NextFunction } from 'express';
// @end

class RequestParams {
  private req: Request;

  constructor(req: Request) {
    this.req = req;
  }

  /**
   * Metodo que permite formatear los parametros de una peticion segun el metodo desde el cual fue invocada
   * @returns [Object] Retorna en formato de objeto los parametros que han sido proporcionados desde una peticion
   */
  all = () => {

    let fields = {};

    if (this.req.method === "GET") {
      fields = this.req.query;
    } else if (this.req.method === "POST" || this.req.method === "PUT") {
      for (var i in this.req.body) {
        fields[i] = this.req.body[i];
      }
    }

    Object.assign(fields, this.req.params);
    fields = this.transformDate(fields);

    return fields;
  }

  /**
   * Metodo que permite encontrar y formatear un objeto presente en una peticion
   * @param field Campo que se desea buscar en los parametros de la peticion
   * @param [default_field] Valor por defecto que se asignara al campo si este no esta presente en la peticion
   * @returns Retorna el valor del campo proporcionado o su valor por defecto
   */
  input = (field, default_field: any = null) => {

    let field_res = undefined;

    if (this.req.method === "GET") {
      if (typeof this.req.query[field] !== "undefined") {
        field_res = this.req.query[field];
      }
    } else if (this.req.method === "POST" || this.req.method === "PUT") {
      if (typeof this.req.body[field] !== "undefined") {
        field_res = this.req.body[field];
      }
    }

    if (typeof field_res === "undefined" && (typeof this.req.params === "object" && Object.keys(this.req.params).length > 0)) {
      if (typeof this.req.params[field] !== "undefined") {
        field_res = this.req.params[field];
      }
    }

    if (typeof field_res === "undefined") field_res = default_field;

    field_res = this.transformDate(field_res);

    return field_res;
  }

  getRawBody = () => {
    return new Promise((resolve, reject) => {
      let data = '';
      this.req.on('data', (chunk) => {
        data += chunk
      })

      this.req.on('end', () => {
        resolve(data)
      })

      this.req.on('error', (err) => {
        reject(err)
      })
    })
  }

  private transformDate = (field) => {
    if (typeof field === 'object') {
      for (const key in field) {
        if (field.hasOwnProperty(key)) {
          field[key] = this.transformDate(field[key]);
        }
      }
    } else {
      if (typeof field === "string"){
        const RegExPattern = /^(\d{4})(\/|-)(0[1-9]|1[0-2])\2([0-2][0-9]|3[0-1])(\s)([0-1][0-9]|2[0-3])(:)([0-5][0-9])(:)([0-5][0-9])$/;
        if ((field.match(RegExPattern)) && (field!='')) {
          const date  = new Date(field);
          const now   = new Date();
                field = new Date( date.getTime() -  ( now.getTimezoneOffset() * 60000 ) );
        }
      }
    }

    return field;
  }
}

class RequestParamsMiddleware {

    /*===============================================
    =            Estructura de un metodo            =
    ================================================
      //La estructura de un metodo debe ser la siguiente:
      public methodName = (req: Request, res: Response, next: NextFunction) => {
          next();
      }
    /*======  End of Estructura de un metodo  =====*/

    constructor () {}

    /**
     * Metodo que permite agregar a cada objeto Request una clase cuyos metodos permiten trabajar con los datos de una peticion
     * @param req Objeto de clase Request de express
     * @param res Objeto de clase Response de express
     * @param next Objeto de clase NextFunction de express
     */
    public addMethodToRequest = (req: Request, res: Response, next: NextFunction) => {
      req.getParameters = new RequestParams(req);
      next();
    }
}

export const requestParamsMiddleware = new RequestParamsMiddleware();
export { RequestParamsMiddleware }

