// @import_dependencies_node Import libraries
const pdf = require('html-pdf');
const Handlebars = require("handlebars");
// @end

// @import config
import { environment, dist_dir, pdf_config } from "@scnode_core/config/globals";
// @end

// @import utilities
import {fileUtility} from '@scnode_core/utilities/fileUtility'
import {responseUtility} from '@scnode_core/utilities/responseUtility'
import { attachedUtility } from "@scnode_core/utilities/attached/attachedUtility";
// @end

// @import types
import {UploadConfig} from '@scnode_core/types/default/attached/attachedTypes'
import {IGeneratePdfConfig} from '@scnode_core/types/default/pdf/pdfTypes'
// @end

// Dirección URL del plugin utilizado - https://www.npmjs.com/package/html-pdf

class HtmlPdfUtility {

  private defaultTemplatePdfPath = null

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {
    const base_dir = __dirname.split('core');
    this.defaultTemplatePdfPath = base_dir[0] + 'views/pdf/templates/';
  }

  /**
   * Metodo que permite generar el PDF
   * @param config Configuración para la generación del documento PDF
   * @returns
   */
  public generatePdf = async (config: IGeneratePdfConfig) => {
    try {
      let response: any = {}

      let configPdf = {}
      if (config.options) {
        configPdf = {
          ...configPdf,
          ...config.options
        }
      }

      let content = null

      if (config.from === 'file') {
        if (!config.file) return responseUtility.buildResponseFailed('json', null, {error_key: 'pdf.html_pdf.file_config_required'})

        const responseHtmlFile: any = await this.getHtmlFile(config)
        if (responseHtmlFile.status === 'error') return responseHtmlFile

        if (config.file.type === 'hbs') {
          const template = Handlebars.compile(responseHtmlFile.content);
          content = template((config.file.context) ? config.file.context : {});
        } else {
          content = responseHtmlFile.content
        }
      } else if (config.from === 'content') {
        if (!config.content) return responseUtility.buildResponseFailed('json', null, {error_key: 'pdf.html_pdf.content_config_required'})
        content = config.content.html
      }

      if (!content) return responseUtility.buildResponseFailed('json', null, {error_key: 'pdf.html_pdf.content_config_required'})

      const pdfGenerated: {buffer: any, base64: any} | null = await new Promise((resolve, reject) => {
        pdf.create(content, configPdf).toBuffer(function(err, buffer) {
          if (err) return null
          resolve({
            buffer: buffer,
            base64: buffer.toString('base64')
          })
        });
      })

      if (!pdfGenerated) return responseUtility.buildResponseFailed('json', null, {error_key: 'pdf.html_pdf.fail_to_generate'})

      response.buffer = pdfGenerated.base64

      // @INFO: Carga del PDF a un servidor para su futura consulta
      response.path = await this.updloadPdfGenerated(config, pdfGenerated.buffer)

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        ...response
      }})
    } catch (error) {
      return responseUtility.buildResponseFailed('json', null, {additional_parameters: {error_message: error.message}} )
    }
  }

  /**
   * Metodo que permite obtener el archivo HTML desde el sistema de
   * @param config Configuración para la generación del documento PDF
   * @returns
   */
  private getHtmlFile = async (config: IGeneratePdfConfig) => {

    let path = `${this.defaultTemplatePdfPath}${config.file.path}.${config.file.type}`

    if (!fileUtility.fileExists(path)) return responseUtility.buildResponseFailed('json', null, {error_key: 'pdf.html_pdf.file_not_found'})

    try {
      const content = fileUtility.readFileSync(path);
      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        content
      }})
    } catch (error) {
      return responseUtility.buildResponseFailed('json', null, {error_key: 'pdf.html_pdf.file_not_found'})
    }
  }

  /**
   * Metodo que permite cargar un documento PDF generado (buffer) a un servicio en la nube
   * @param config Configuración para la generación del documento PDF
   * @param buffer Buffer del archivo PDF
   * @returns
   */
  private updloadPdfGenerated = async (config: IGeneratePdfConfig, buffer: string) => {

    let filePath = null
    if (config.attached) {
      let pathUpload = 'pdfs'

      if (pdf_config && typeof pdf_config === 'object') {
        if (pdf_config.path_upload_default) pathUpload = pdf_config.path_upload_default
      }

      if (config.attached.path_upload_default) pathUpload = config.attached.path_upload_default

      let uploadConfig:UploadConfig = {
        path_upload: pathUpload,
        file_mime_type: ['application/pdf'],
      }

      if (config.attached.upload_config) {
        uploadConfig = {
          ...uploadConfig,
          ...config.attached.upload_config
        }
        if (uploadConfig.path_upload) {
          uploadConfig.path_upload = `${pathUpload}/${uploadConfig.path_upload}`
        }
      }

      const files_status_upload = await attachedUtility.uploadFiles({
        name        : config.attached.file.name,    // Nombre original del archivo adjunto (Ex: car.jpg)
        mv          : () => {},       // Una función para mover el archivo a otro lugar en su servidor
        mimetype    : 'application/pdf',    // El mimetype del archivo
        data        : buffer,       // Una representación del búfer de su archivo, devuelve el búfer vacío en caso de que la opción useTempFiles se haya establecido en verdadero.
        tempFilePath: null,       // Una ruta al archivo temporal en caso de que la opción useTempFiles se configurara como verdadera.
        truncated   : false,   // Un valor booleano que representa si el archivo está por encima del límite de tamaño.
        size        : 10,    // Tamaño cargado en bytes
        md5         : '',    // MD5 del archivo cargado
      }, uploadConfig);

      if (Array.isArray(files_status_upload) && files_status_upload.length > 0) {
        if (files_status_upload[0].status === 'success') {
          filePath = files_status_upload[0].path
        }
      }
    }
    return filePath
  }
}

export const htmlPdfUtility = new HtmlPdfUtility();
export { HtmlPdfUtility }
