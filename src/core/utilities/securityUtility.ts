// @import_dependencies_node Import libraries
// @end

// @import_utilities Import utilities
import { fileUtility } from "@scnode_core/utilities/fileUtility";
// @end

class SecurityUtility {

    private security_dir_path     = null;
    private json_permissions_path = null;

    /*===============================================
    =            Estructura de un metodo            =
    ================================================
        // La estructura de un metodo debe ser la siguiente:
        public methodName = () => {}
    /*======  End of Estructura de un metodo  =====*/

    constructor () {
        const base_dir                   = __dirname.split('core');
              this.security_dir_path     = base_dir[0] + 'resources/security/';
              this.json_permissions_path = this.security_dir_path + 'permissions.json';
    }

    /**
     * Metodo que permite reconstruir el archivo de configuración de permisos de acceso por ruta
     * @returns
     */
    public buildJsonPermissions = () => {

        if (fileUtility.fileExists(this.json_permissions_path) === true) {
            fileUtility.removeFileSync(this.json_permissions_path);
        }

        fileUtility.createDirRecursive(this.security_dir_path);

        const content = `{
    "end_file": "end_file"
}`;

        fileUtility.writeFileSync(this.json_permissions_path,content);
        return true;
    }

    /**
     * Metodo que permite agregar al archivo de configuración de permisos la relacion de URL - Permisos
     * @param url String que contiene la URL sobre la cual se aplicaran los permisos
     * @param permissions Array de strings que contiene los permisos que se aplicaran sobre una ruta
     */
    public addPermissionRoute = (url: string, permissions: Array<string>) => {

        if (fileUtility.fileExists(this.json_permissions_path) === true) {
            if (permissions && permissions.length > 0) {
                let permissions_string = "{";
                const total_permissions = permissions.length;
                let count = 1;
                permissions.map((val) => {
                    let connector = ",";
                    if (count >= total_permissions) {
                        connector = "";
                    }
                    permissions_string += ` "${val}": "${val}"${connector}`;
                    count++;
                });
                permissions_string += " }";

                const file             = fileUtility.readFileSync(this.json_permissions_path);
                const content_file_arr = file.split('\n');
                let new_content_file = [];

                content_file_arr.forEach((val, index) => {
                    const line = val;
                    if (index === 1) {
                        new_content_file.push(`    "${url}": ${permissions_string},`);
                    }
                    new_content_file.push(line);
                });
                const content_file_updated = new_content_file.join('\n');

                fileUtility.writeFileSync(this.json_permissions_path,content_file_updated);
            }
        }
    }
}

export const securityUtility = new SecurityUtility();
export { SecurityUtility }
