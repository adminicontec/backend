// @import_dependencies_node Import libraries
import * as path from 'path';
import * as jsonMerger from 'json-merger';
const i18next = require('i18next')
// @end

// @import_config_files Import config files
import { default_language, i18n_config } from "@scnode_core/config/globals";
// @end

// @import_utilities Import utilities
import { fileUtility } from "@scnode_core/utilities/fileUtility";
// @end

interface IAddResourceBundle {
    lng       : string,
    resources : object,
    ns?       : string,
    deep?     : boolean,
    overwrite?: boolean,
  }

class I18nUtility {

    public dir_global = 'src/core/resources/langs/';
    public dir_local  = 'src/app/resources/langs/';
    public dir_app    = 'src/resources/langs/';

    public langs = [];

    /*===============================================
    =            Estructura de un metodo            =
    ================================================
        // La estructura de un metodo debe ser la siguiente:
        public methodName = () => {}
    /*======  End of Estructura de un metodo  =====*/

    /**
     * Metodo que permite iniciar la configuración I18N
     * @returns
     */
    public initConfigI18n = async () => {
        const base_dir = __dirname.split('core');
        const dir      = base_dir[0] + 'resources/langs';

        let resources = {}

        const dir_content = fileUtility.readDirSync(dir)
        const langs_aux = await this.searchJsonFilesInDir(dir_content,dir);

        for (const key in langs_aux) {
            const element = langs_aux[key];
            if (!resources[key]) resources[key] = {}
            for (const i in element) {
                if (element.hasOwnProperty(i)) {
                    const item = element[i];
                    try {
                        const result = await fileUtility.readFileSync(item)
                        resources[key] = {
                            translation: JSON.parse(result)
                        }
                    } catch(err) {}
                }
            }
        }

        try {
            i18next.init({
                lng: default_language,
                debug: (i18n_config && i18n_config.debug) ? true : false,
                resources
            }, function(err, t) {
            });
        } catch (e) {}
    }

    /**
     * Metodo que permite crear el directorio y archivos de internacionalizacion
     */
    public buildI18nDirectories = async () => {

        this.langs = [];

        const base_dir = __dirname.split('core');

        const full_dir_global = base_dir[0] + this.dir_global;
        const full_dir_local  = base_dir[0] + this.dir_local;
        const full_dir_app    = base_dir[0] + this.dir_app;

        fileUtility.removeDirRecursive(full_dir_app);
        fileUtility.createDirRecursive(full_dir_app);

        let langs_aux = {};

        // @INFO: Asignando los valores de internacionalización desde el repositorio global
        const dir = fileUtility.readDirSync(full_dir_global);
        langs_aux = await this.searchJsonFilesInDir(dir, full_dir_global);
        await this.consolidateLangs(langs_aux);

        // @INFO: Asignando los valores de internacionalización desde el repositorio local
        const dir_local = fileUtility.readDirSync(full_dir_local);
        langs_aux = await this.searchJsonFilesInDir(dir_local,full_dir_local);
        await this.consolidateLangs(langs_aux);

        // @INFO: Uniendo los valores de internacionalización
        for (const key in this.langs) {
            if (this.langs.hasOwnProperty(key)) {
                const element = this.langs[key];
                var dest = full_dir_app + key + '.json';

                try {
                    var result = await jsonMerger.mergeFiles(element,{stringify: true});
                    fileUtility.writeFileSync(dest,result);
                } catch(err) {}
            }
        }

    }

    /**
     * Metodo que permite obtener TODOS los archivos JSON de un directorio y retornarlos
     * @param files Archivos del directorio
     * @param path_dir Directorio donde se busco
     * @returns [object] Objeto que contiene los archivos de internacionalizacion
     */
    private searchJsonFilesInDir = (files, path_dir) =>{

        let langs = {};

        files.map((file) => {
            return path.join(path_dir,file);
        }).filter((file) => {
            return fileUtility.fileExists(file);
        }).forEach((file) => {
            const ext = path.extname(file);
            const name_complete = path.basename(file);
            const name_simple = name_complete.replace(ext,"");

            if (ext === '.json') {
                langs[name_simple] = [];
                langs[name_simple].push(file);
            }
        });

        return langs;
    }

    /**
     * Metodo que permite asignar a la variable global los lenguajes disponibles
     * @param langs_aux Listado de archivos por lenguaje
     */
    private consolidateLangs = (langs_aux) => {
        for (const key in langs_aux) {
            if (langs_aux.hasOwnProperty(key)) {
                const element = langs_aux[key];
                if (!this.langs[key]) {
                    this.langs[key] = [];
                }

                for (const i in element) {
                    if (element.hasOwnProperty(i)) {
                        const item = element[i];
                        this.langs[key].push(item);
                    }
                }

            }
        }
    }

    /**
     * Metodo que permite obtener la internacionalización de un texto (key) y asignar los parametros que correspondan
     * @param key Clave de identificación del mensaje dentro de los archivos de internacionalización
     * @param [params] Parametros asociados al mensaje
     * @returns [string] Cadena de texto
     */
    public i18nMessage = (key, params: any = {}) => {
        return this.parseParamsToMessage(i18next.t(key),params);
    }
    // @INFO: Same function
    public __ = (key, params: any = {}) => {
        return this.parseParamsToMessage(i18next.t(key),params);
    }

    /**
     * Metodo que permite asignar los valores proporcionados por la peticion a un texto i18n segun corresponda
     * @param message Texto i18n sobre el cual se desean asignar los parametros
     * @param [params] Parametros asociados al mensaje
     * @returns  [string] Cadena de texto
     */
    public parseParamsToMessage = (message, params: any = {}) => {
        if (params && typeof params === 'object') {
            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    const element = params[key];
                    var reg = new RegExp(':'+key,'g');
                    if (typeof message === 'string') {
                        message = message.replace(reg, element);
                    }
                }
            }
        }

        return message;
    }

    /**
     * Metodo que permite cambiar el idioma actual
     * @param lng Idioma a cambiar
     */
    public setLocale = (lng) => {
        i18next.changeLanguage(lng)
    }

    /**
     * Agrega o actualiza datos de los recursos
     * @param data
     */
    public addResourceBundle = (data: IAddResourceBundle) => {

        let config = {
          ns: 'translation',
          deep: true,
          overwrite: true,
          ...data,

        }
        i18next.addResourceBundle(config.lng, config.ns, data.resources, config.deep, config.overwrite)
    }
}

export const i18nUtility = new I18nUtility();
export { I18nUtility }
