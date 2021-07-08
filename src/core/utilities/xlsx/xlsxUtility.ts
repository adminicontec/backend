// @import_dependencies_node Import libraries
import * as XLSX from "xlsx";
// @end

// @import config
import { xlsx_config } from '@scnode_core/config/globals'
// @end

// @import_utilities Import utilities
import { attachedUtility } from '@scnode_core/utilities/attached/attachedUtility'
// @end

// @import types
import { UploadConfig } from '@scnode_core/types/default/attached/attachedTypes'
import { IBuildXLSX, IGenerateXLSXConfig } from '@scnode_core/types/default/xls/xlsTypes'
// @end

class XlsxUtility {

  constructor() { }


  /**
   * Metodo que permite construir un archivo XLSX
   * @param data
   */
  public buildXLSX = async (data: IBuildXLSX) => {
    try {
      //@INFO Se valida si viene un workbook y si no, lo crea
      if (!data.wb) data.wb = await XLSX.utils.book_new();
      if (!data.type) data.type = 'buffer'

      //@INFO Se crea un worksheet
      const ws = await XLSX.utils.json_to_sheet(data.jsonData, { header: data.arrayHeader, skipHeader: data.skipHeader });

      //@INFO Se agrega al workbook
      XLSX.utils.book_append_sheet(data.wb, ws, data.filename.replace('/', ''))

      //@INFO Se crea el buffer del archivo en tipo XLSX
      const xlsx = XLSX.write(data.wb, { type: data.type, bookType: 'xlsx' })

      return xlsx

    } catch (e) {
      return null
    }
  }

  /**
   * Metodo que permite cargar un archivo xlsx al servidor
   * @param config
   * @param buffer
   */
  public uploadXLSX = async (config: IGenerateXLSXConfig, buffer: string) => {
    try {

      let filePath = null
      if (config.attached) {
        let pathUpload = 'xlsx'
        if (xlsx_config && typeof xlsx_config === 'object') {
          if (xlsx_config.path_upload_default) pathUpload = xlsx_config.path_upload_default
        }

        if (config.attached.path_upload_default) pathUpload = config.attached.path_upload_default

        let uploadConfig: UploadConfig = {
          path_upload: pathUpload,
          file_mime_type: ['application/xlsx'],
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
          name: config.attached.file.name,    // Nombre original del archivo adjunto (Ex: car.jpg)
          mv: () => { },       // Una función para mover el archivo a otro lugar en su servidor
          mimetype: 'application/xlsx',    // El mimetype del archivo
          data: buffer,       // Una representación del búfer de su archivo, devuelve el búfer vacío en caso de que la opción useTempFiles se haya establecido en verdadero.
          tempFilePath: null,       // Una ruta al archivo temporal en caso de que la opción useTempFiles se configurara como verdadera.
          truncated: false,   // Un valor booleano que representa si el archivo está por encima del límite de tamaño.
          size: 10,    // Tamaño cargado en bytes
          md5: '',    // MD5 del archivo cargado
        }, uploadConfig);

        if (Array.isArray(files_status_upload) && files_status_upload.length > 0) {
          if (files_status_upload[0].status === 'success') {
            filePath = files_status_upload[0].path
          }
        }
      }

      return filePath
    } catch (e) {
      console.log('e', e.message)
      return null
    }
  }


  public extractXLSX = async (buffer_data: Buffer, sheetName: string) => {

    let buffer = Buffer.from(buffer_data);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheet_name_list = workbook.SheetNames;

    console.log("List of sheets:");
    console.log(sheet_name_list);

    // Lee la primer hoja del archivo

    const xlData: any = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheet_name_list[0]]
    );
    for (const key in xlData) {

    }

    return xlData;
  }

}

export const xlsxUtility = new XlsxUtility();
export { XlsxUtility }
