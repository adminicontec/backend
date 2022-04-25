// @import_dependencies_node Import libraries
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService';
import { documentQueueService } from '@scnode_app/services/default/admin/documentQueue/documentQueueService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { PortfolioProgram, Modular } from '@scnode_app/models'
// import { Model } from 'mongoose'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes';
import { IPortfolioProgram, IPortfolioProgramDelete, IPortfolioProgramProcessFile, IPortfolioProgramQuery } from '@scnode_app/types/default/admin/portfolio/portfolioProgramTypes';
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility';
// @end

// let algo: Model<{algo: string}>;
// algo.collection()

class PortfolioProgramService {

  private default_document_path: string = 'documents/portfolio';

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite validar si un registro existe segun parametros
   * @param params Filtros para buscar el elemento
   * @returns
   */
   public findBy = async (params: IQueryFind) => {

    try {
      let where = {}
      if (params.where && Array.isArray(params.where)) {
        params.where.map((p) => where[p.field] = p.value)
      }

      let select = 'id name code modular hours courses'
      if (params.query === QueryValues.ALL) {
        const registers = await PortfolioProgram.find(where).select(select)
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          portfolioPrograms: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await PortfolioProgram.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'forum.category.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          portfolioProgram: register
        }})
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite insertar/actualizar un registro
   * @param params Elementos a registrar
   * @returns
   */
  public insertOrUpdate = async (params: IPortfolioProgram) => {

    try {

      // Verificar que no exista otro programa con el mismo código
      const exist = await PortfolioProgram.findOne({code: params.code});

      if (params.id || exist) {
        const register = await PortfolioProgram.findOne({_id: exist ? exist._id : params.id})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'forum.category.not_found'})

        const response: any = await PortfolioProgram.findByIdAndUpdate(exist ? exist._id : params.id, params, { useFindAndModify: false, new: true })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            portfolioProgram: {
              _id: response._id,
              name: response.name,
              code: response.code,
              modular: response.modular,
              hours: response.hours,
              courses: response.courses
            }
          }
        })

      } else {
        const response: any = await PortfolioProgram.create(params)

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            portfolioProgram: {
              _id: response._id,
              name: response.name,
              code: response.code,
              modular: response.modular,
              hours: response.hours,
              courses: response.courses
            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: IPortfolioProgramDelete) => {
    try {
      const find: any = await PortfolioProgram.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'forum.category.not_found' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (filters: IPortfolioProgramQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id name code modular hours courses'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if(filters.search){
      const search = filters.search
      where = {
        ...where,
        $or:[
          {name: { $regex: '.*' + search + '.*',$options: 'i' }},
          {'courses.name': { $regex: '.*' + search + '.*',$options: 'i' }}
        ]
      }
    }

    if (filters.modular) {
      where = {
        ...where,
        modular: { $regex: '.*' + filters.modular + '.*',$options: 'i' },
      }
    }

    if (filters.code) {
      where = {
        ...where,
        code: { $regex: '.*' + filters.code + '.*',$options: 'i' },
      }
    }

    let registers = []
    try {
      registers =  await PortfolioProgram.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        portfolioPrograms: [
          ...registers
        ],
        total_register: (paging) ? await PortfolioProgram.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
   * Metodo que permite subir un documento a la cola
   * @param params Filtros para eliminar
   * @returns
   */
  public uploadFile = async (params: any, files: any) => {
    try {
      let fileDir: string;
      if (files && files.file_xlsx) {
        // Subir el archivo
        const uploadResponse: any = await uploadService.uploadFile(files.file_xlsx, this.default_document_path);
        if (uploadResponse.status === 'error') return uploadResponse;
        if (uploadResponse.hasOwnProperty('name')) fileDir = uploadResponse.name;
        // Cargar el archivo a la cola
        const paramsDocument = {
          status: 'New',
          type: 'Portfolio',
          docPath: uploadResponse.path,
          userId: params.user,
          sendEmail: false
        }
        const respDocumentQueue: any = await documentQueueService.insertOrUpdate(paramsDocument);

        if (respDocumentQueue.status == 'error') {
          return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'document.queue.insertOrUpdate.failed', params: { error: respDocumentQueue.error } } });
        } else {
          return responseUtility.buildResponseSuccess('json')
        }
      }
      return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'document.queue.insertOrUpdate.failed', params: {} } });
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite procesar el archivo para cargar el portafolio
   * @param params Filtros para eliminar
   * @returns
   */
  public processFile = async (params: IPortfolioProgramProcessFile) => {
    try{
      let dataPrograms = await xlsxUtility.extractXLSX(params.contentFile.data, 'PRIORIDADES PROGRAMAS', 0);
      if (dataPrograms && dataPrograms.length) {
        // Agrupar la información según el programa
        let organizedData: IPortfolioProgram[] = [];
        let processLog: any[] = [];
        let errorLog: any[] = [];
        for await (let program of dataPrograms) {
          if (program['Código del Programa'] && program['Código del Programa'][0] !== 'E') {
            const idx = organizedData.findIndex((d) => d.code === program['Código del Programa']);
            if (idx >= 0) {
              organizedData[idx].courses.push({
                name: program['Curso'],
                code: program['Código']
              });
            } else {
              organizedData.push({
                name: program['Programa'],
                code: program['Código del Programa'],
                modular: program['Modular nuevo'],
                hours: Number(program['Horas programa']),
                courses: [{
                  name: program['Curso'],
                  code: program['Código']
                }]
              })
            }
          }
        };

        // Eliminar la información anterior
        await PortfolioProgram.collection.drop();

        // Subir los programas
        for await (let program of organizedData) {
          const responseUpload: any = await this.insertOrUpdate(program);
          if (responseUpload.status === 'error') {
            errorLog.push({
              ...responseUpload,
              ...program
            })
          } else {
            processLog.push(program)
          }
        }

        // Actualizar el document queue con los datos
        const respDocumentQueue: any = await documentQueueService.insertOrUpdate({
          id: params.recordToProcess.id,
          status: 'Complete',
          processLog: processLog,
          errorLog: errorLog,
          // processLogTutor: respProcessQualifiedTutorData?.qualifiedTeachers,
          // errorLogTutor: respProcessQualifiedTutorData?.errorLog
        });

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            ok: true
          }
        });
      } else {
        return responseUtility.buildResponseFailed('json');
      }
    } catch(e){
      console.log('portfolioProgramService => processFile error: ', e);
      return responseUtility.buildResponseFailed('json');
    }
  }


}

export const portfolioProgramService = new PortfolioProgramService();
export { PortfolioProgramService as DefaultAdminPortfolioPortfolioProgramService };
