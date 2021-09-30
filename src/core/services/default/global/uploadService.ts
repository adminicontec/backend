// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { attachedUtility } from '@scnode_core/utilities/attached/attachedUtility'
// @end

// @import models
// @end

// @import types
// @end

class UploadService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite subir un archivo
   * @param file Archivo a cargar
   * @param path_upload Ruta donde se alojara el archivo
   * @param [config] Configuración para la carga del archivo
   * @returns
   */
  public uploadFile = async (file: any, path_upload: string, config: any = {}) => {

    let defaultConfig = {
      rename: true,
      // mimes: ['image/png', 'image/jpeg', 'image/x-icon'],
      ...config
    }

    console.log('in uploadFile' ,defaultConfig)
    console.log('path_upload', path_upload)
    const files_status_upload = await attachedUtility.uploadFiles(file, {
      path_upload: path_upload,
      rename: defaultConfig.rename,
      // file_mime_type: defaultConfig.mimes,
    })

    let uploaded = true
    if (files_status_upload.status === 'error') {
      uploaded = false
    } else if (files_status_upload.length === 0) {
      uploaded = false
    } else {
      if (files_status_upload[0].status === 'error') {
        uploaded = false
      }
    }

    const upload = files_status_upload[0]
    if (uploaded === false) {
      return responseUtility.buildResponseFailed('json', null, {
        error_key: 'uploads.failed',
      })
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        path: `${path_upload}/${upload.new_name}`,
        name: upload.new_name,
      },
    })
  }

}

export const uploadService = new UploadService();
export { UploadService as DefaultGlobalUploadService };
