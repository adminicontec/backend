// @import_dependencies_node Import libraries
const fetch = require('node-fetch')
const urlMetadata = require('url-metadata')
// @end

// @import config
import {customs} from '@scnode_core/config/globals'
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
// @end

// @import types
import {IUploadImage, IFetchUrlFromLink} from '@scnode_app/types/default/admin/editorJs/editorJsTypes'
// @end

class EditorJsService {

  private path_upload_image = 'editorjs/editor'

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite cargar una imagen desde el plugin de Imagenes
   * @param uploadsData Objeto con la data de la imagen a cargar
   * @returns
   */
  public uploadImage = async (uploadsData: IUploadImage) => {

    let uploadStatus = null
    if (uploadsData.type === 'by_file') {
      uploadStatus = await this.uploadImageByFile(uploadsData)
    } else if (uploadsData.type === 'by_url') {
      uploadStatus = await this.uploadImageByUrl(uploadsData)
    }

    if (!uploadStatus) return responseUtility.buildResponseFailed('json', null, {additional_parameters: {success: 0}})

    return uploadStatus
  }

  /**
   * Metodo que permite obtener la metadata de una URL
   * @param params Objeto con los datos necesarios para consultar la metadata
   * @returns
   */
  public fetchUrlFromLink = async (params: IFetchUrlFromLink) => {
    try {
      const metaResponse = await urlMetadata(params.url);

      const meta = {
        title : (metaResponse.title) ? metaResponse.title : (metaResponse['og:title']) ? metaResponse['og:title'] : '',
        site_name : (metaResponse['og:site_name']) ? metaResponse['og:site_name'] : '',
        description : (metaResponse.description) ? metaResponse.description : (metaResponse['og:description']) ? metaResponse['og:description'] : '',
        image : {
          "url" : (metaResponse.image) ? metaResponse.image : (metaResponse['og:image']) ? metaResponse['og:image'] : ''
        }
      }

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        success: 1,
        meta
      }})

    } catch (e) {
      return responseUtility.buildResponseFailed('json', null, {additional_parameters: {success: 0}})
    }
  }

  /**
   * Metodo que permite cargar una imagen desde un archivo
   * @param uploadsData Objeto con la data de la imagen a cargar
   * @returns
   */
  private uploadImageByFile = async (uploadsData: IUploadImage) => {
    const defaulPath = this.path_upload_image

    const response_upload: any = await uploadService.uploadFile(uploadsData.file, defaulPath)
    if (response_upload.status === 'error') return response_upload

    return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
      success: 1,
      file: {
        url : await this.buildImageUrl(response_upload.path),
        relative_path: response_upload.path
      }
    }})
  }

  /**
   * Metodo que permite cargar una imagen desde una URL
   * @param uploadsData Objeto con la data de la imagen a cargar
   * @returns
   */
  private uploadImageByUrl = async (uploadsData: IUploadImage) => {
    try {
      const response = await fetch(uploadsData.url);
      const buffer = await response.buffer();

      let file = {
        name: uploadsData.url,
        data: buffer,
      }

      uploadsData.file = file

      return await this.uploadImageByFile(uploadsData)
    } catch (e) {
      return responseUtility.buildResponseFailed('json', null, {additional_parameters: {success: 0}})
    }
  }

  /**
   * Metodo que permite cargar
   * @param relativePath Path relativo de la imagen
   * @returns
   */
  private buildImageUrl = async (relativePath: string) => {
    if (!relativePath) return null
    return `${customs['uploads']}/${relativePath}`
  }
}

export const editorJsService = new EditorJsService();
export { EditorJsService as DefaultAdminEditorJsEditorJsService };
