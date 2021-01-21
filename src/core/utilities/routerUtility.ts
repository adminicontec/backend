// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { generalUtility } from "@scnode_core/utilities/generalUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
import { securityUtility } from "@scnode_core/utilities/securityUtility";
// @end

type MiddlewareRequest = {
    middleware: string,   // Nombre del middleware que se desea ejecutar separado por el caracter (-)
    method    : string,   // Metodo dentro del middleware que se desea ejecutar separado por el caracter (-)
    condition?: string    // Condicion para lanzar el middleware (Llave)
    dir?      : string    // Directorio donde se aloja el middleware
};

class RouterUtility {

    private middlewares_in_all_request: MiddlewareRequest[] = [
        //Ex: {middleware: 'middleware-name', method: 'method-name', condition?: 'key'}
        {middleware: 'authenticated', method: 'ensure-auth', condition: "auth"},
        {middleware: 'security', method: 'server-access-control'},
        {middleware: 'security', method: 'access-restriction'},
    ];

    /*===============================================
    =            Estructura de un metodo            =
    ================================================
        // La estructura de un metodo debe ser la siguiente:
        public methodName = () => {}
    /*======  End of Estructura de un metodo  =====*/

    constructor () {}

    /**
     * Metodo que genera una ruta express para el metodo GET
     * @param app Objeto de clase Express Aplication
     * @param prefix Prefijo de la ruta
     * @param url Url asignada a la ruta
     * @param method Funcion que debe lanzarse al invocarse la ruta
     * @param [middlewares] Array de middlewares personalizados para la ruta
     * @param [conditional_middlewares] Array de llaves de condicionales para lanzar middlewares por defecto
     * @param access_restriction Array de strings que contienen los permisos que se aplicaran sobre una ruta
     */
    public get = (app, prefix: string, url: string, method: any, middlewares?: MiddlewareRequest[], conditional_middlewares?: Array<string>, access_restriction?: Array<string>) => {
        const full_url = prefix + url;
        if (access_restriction && access_restriction.length > 0) securityUtility.addPermissionRoute(full_url,access_restriction);
        const middlewares_default = this.mergeMiddlewares(middlewares,conditional_middlewares);
        app.get(full_url,middlewares_default,method);
    }

    /**
     * Metodo que genera una ruta express para el metodo POST
     * @param app Objeto de clase Express Aplication
     * @param prefix Prefijo de la ruta
     * @param url Url asignada a la ruta
     * @param method Funcion que debe lanzarse al invocarse la ruta
     * @param [middlewares] Array de middlewares personalizados para la ruta
     * @param [conditional_middlewares] Array de llaves de condicionales para lanzar middlewares por defecto
     * @param access_restriction Array de strings que contienen los permisos que se aplicaran sobre una rutaç
     */
    public post = (app, prefix: string, url: string, method: any, middlewares?: MiddlewareRequest[], conditional_middlewares?: Array<string>, access_restriction?: Array<string>) => {
        const full_url = prefix + url;
        if (access_restriction && access_restriction.length > 0) securityUtility.addPermissionRoute(full_url,access_restriction);
        const middlewares_default = this.mergeMiddlewares(middlewares,conditional_middlewares);
        app.post(full_url,middlewares_default,method);
    }

    /**
     * Metodo que genera una ruta express para el metodo PUT
     * @param app Objeto de clase Express Aplication
     * @param prefix Prefijo de la ruta
     * @param url Url asignada a la ruta
     * @param method Funcion que debe lanzarse al invocarse la ruta
     * @param [middlewares] Array de middlewares personalizados para la ruta
     * @param [conditional_middlewares] Array de llaves de condicionales para lanzar middlewares por defecto
     * @param access_restriction Array de strings que contienen los permisos que se aplicaran sobre una rutaç
     */
    public put = (app, prefix: string, url: string, method: any, middlewares?: MiddlewareRequest[], conditional_middlewares?: Array<string>, access_restriction?: Array<string>) => {
        const full_url = prefix + url;
        if (access_restriction && access_restriction.length > 0) securityUtility.addPermissionRoute(full_url,access_restriction);
        const middlewares_default = this.mergeMiddlewares(middlewares,conditional_middlewares);
        app.put(full_url,middlewares_default,method);
    }

    /**
     * Metodo que genera una ruta express para el metodo DELETE
     * @param app Objeto de clase Express Aplication
     * @param prefix Prefijo de la ruta
     * @param url Url asignada a la ruta
     * @param method Funcion que debe lanzarse al invocarse la ruta
     * @param [middlewares] Array de middlewares personalizados para la ruta
     * @param [conditional_middlewares] Array de llaves de condicionales para lanzar middlewares por defecto
     * @param access_restriction Array de strings que contienen los permisos que se aplicaran sobre una rutaç
     */
    public delete = (app, prefix: string, url: string, method: any, middlewares?: MiddlewareRequest[], conditional_middlewares?: Array<string>, access_restriction?: Array<string>) => {
        const full_url = prefix + url;
        if (access_restriction && access_restriction.length > 0) securityUtility.addPermissionRoute(full_url,access_restriction);
        const middlewares_default = this.mergeMiddlewares(middlewares,conditional_middlewares);
        app.delete(full_url,middlewares_default,method);
    }

    /**
     * Metodo que permite unir los middlewares proporcionados por el usuario y los asignados por defecto
     * @param [middlewares] Array de middlewares personalizados para la ruta
     * @param [conditional_middlewares] Array de llaves de condicionales para lanzar middlewares por defecto
     * @returns  [array] Array con instancias de middlewares
     */
    private mergeMiddlewares = (middlewares: MiddlewareRequest[] = [], conditional_middlewares?: Array<string>) => {

        let middlewares_default = [];

        this.middlewares_in_all_request.map((val,i) => { // Middleware asignados por defecto
            let add_middleware = true;
            if (val.hasOwnProperty('condition')) {
                if (typeof conditional_middlewares === "undefined" || (typeof conditional_middlewares === "object" && conditional_middlewares.indexOf(val["condition"]) === -1)) {
                    add_middleware = false;
                }
            }

            if (add_middleware === true) {
                var instance = this.parseMiddlewareInstance(val);
                if (instance) {
                    middlewares_default.push(instance);
                }
            }
        });

        middlewares.map((val,i) => { // Middlewares asignados por el usuario
            const instance = this.parseMiddlewareInstance(val);
            if (instance) {
                middlewares_default.push(instance);
            }
        });

        return middlewares_default;
    }

    /**
     * Metodo que permite convertir la estructura MiddlewareRequest en una instancia de middleware
     * @param middleware_data Objeto de tipo MiddlewareRequest
     * @returns [object] Instancia de middleware
     */
    private parseMiddlewareInstance = (middleware_data: MiddlewareRequest) => {

        let instance = null;
        let dir = '';

        if (middleware_data.hasOwnProperty('dir')) {
            dir = middleware_data.dir;
        }

        var middleware_instance_response = requestUtility.middlewareInstance(middleware_data.middleware,dir);

        if (middleware_instance_response.status === "success") {
            const middleware_instance = middleware_instance_response["middleware"];

            var method_name_formated = generalUtility.upperCaseString(middleware_data.method, true);
            if (typeof middleware_instance[method_name_formated] !== "undefined") {
                instance = middleware_instance[method_name_formated];
            }
        }

        return instance;
    }
}

export const routerUtility = new RouterUtility();
export { RouterUtility }
