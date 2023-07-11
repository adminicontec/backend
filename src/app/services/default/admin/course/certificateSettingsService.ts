// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { requestUtility, ValidatorRequest } from '@scnode_core/utilities/requestUtility';
// @end

// @import models
import { CertificateSettings, CourseScheduling, CourseSchedulingDetails, User } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes';
import { CertificateSettingsModules, ICertificateSettings, ICertificateSettingsDelete, ICertificateSettingsQuery } from '@scnode_app/types/default/admin/course/certificateSettingsTypes';
// @end

class CertificateSettingsService {

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

      let select = '*'
      if (params.query === QueryValues.ALL) {
        const registers: any = await CertificateSettings.find(where)
          .populate({ path: 'courseScheduling', select: 'id metadata.service_id moodle_id' })
          .populate({ path: 'modules.courseSchedulingDetail', select: 'id moodle_id' })
          .select(select)
          .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            settings: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register: any = await CertificateSettings.findOne(where)
          .populate({ path: 'courseScheduling', select: 'id metadata.service_id moodle_id' })
          .populate({ path: 'modules.courseSchedulingDetail', select: 'id moodle_id' })
          .select(select)
          .lean()

        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate_settings.not_found' })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateSetting: register
          }
        })
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
  public insertOrUpdate = async (params: ICertificateSettings, files?: any) => {

    try {
      const user: any = await User.findOne({_id: params?.user}).select('id username profile.first_name profile.last_name')

      if (params?.modules) {
        const errors = await this.validateModuleStructure(params.modules)
        if (errors.length > 0) {
          return responseUtility.buildResponseFailed('json', null, {
            error_key: 'certificate_settings.modules_invalid',
            additional_parameters: {
              errors
            }
          })
        }
      }

      if (params?.id) {
        const register: any = await CertificateSettings.findOne({ _id: params.id }).lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate_settings.not_found' })

        params.metadata = {
          ...register.metadata,
          lastUpdatedBy: {
            username: user?.username,
            name: `${user?.profile?.first_name} ${user?.profile?.last_name}`
          }
        }

        const response: any = await CertificateSettings.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })
        await CourseScheduling.populate(response, { path: 'courseScheduling', select: 'id metadata.service_id moodle_id' })
        await CourseSchedulingDetails.populate(response, { path: 'modules.courseSchedulingDetail', select: 'id moodle_id' })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateSetting: response
          }
        })
      } else {
        params.metadata = {
          createdBy: {
            username: user?.username,
            name: `${user?.profile?.first_name} ${user?.profile?.last_name}`
          }
        }

        const { _id } = await CertificateSettings.create(params);
        const response: any = await CertificateSettings.findOne({ _id })
          .populate({ path: 'courseScheduling', select: 'id metadata.service_id moodle_id' })
          .populate({ path: 'modules.courseSchedulingDetail', select: 'id moodle_id' })
          .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateSetting: {
              ...response
            }
          }
        })
      }
    } catch (err) {
      console.log('err', err)
      return responseUtility.buildResponseFailed('json', null)
    }
  }

  private validateModuleStructure = async (modules: CertificateSettingsModules[]) => {
    try {
      const errors = []
      let index = 0;
      for (const module of modules) {
        const fields_config: ValidatorRequest[] = [
          {key: 'courseSchedulingDetail', label: 'Identificador del modulo'},
          {key: 'duration', label: 'Duración del modulo para certificado'},
        ];
        const validated = await requestUtility.validator(module, {}, fields_config)
        if (validated.hasError) {
          errors.push({
            key: `modules_${index}`,
            message: validated.fields_status.reduce((accum, element) => {
              if (element.status === 'error') {
                if (!accum) {
                  accum += `${element.reason}`
                } else {
                  accum += `, ${element.reason}`
                }
              }
              return accum;
            }, '')
          })
          index++;
          continue;
        }
        index++;
      }
      return errors;
    } catch (err) {
      throw new Error(`Error al validar la estructura de los modulos`)
    }
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: ICertificateSettingsDelete) => {
    try {
      const find: any = await CertificateSettings.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate_settings.not_found' })

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
  public list = async (filters: ICertificateSettingsQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = '*'
    if (filters.select) {
      select = filters.select
    }

    let where: object[] = [
      {$match: {deleted: false}}
    ]

    if (filters.search) {
      const search = filters.search
      where.push({
        $match: {
          $or: [
            { certificateName: { $regex: '.*' + search + '.*', $options: 'i' } }
          ]
        }
      })
    }

    if (filters.courseScheduling) {
      where.push({
        $match: {
          'courseScheduling': ObjectID(filters.courseScheduling)
        }
      })
    }

    let registers = []
    try {
      const whereAggregate = [].concat(where)
      if (paging) {
        whereAggregate.push({$skip: ((pageNumber - 1) * nPerPage)})
        whereAggregate.push({$limit: nPerPage})
      }
      registers = await CertificateSettings.aggregate(whereAggregate)
        .sort({ createdAt: -1 })
      await CertificateSettings.populate(registers, [
        { path: 'courseScheduling', select: 'id metadata.service_id moodle_id' },
        { path: 'modules.courseSchedulingDetail', select: 'id moodle_id' }
      ])
    } catch (e) {
      console.log('CertificateSettings: ', e)
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        certificateSettings: [
          ...registers
        ],
        total_register: (paging) ? (await CertificateSettings.aggregate(where)).length : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

}

export const certificateSettingsService = new CertificateSettingsService();
export { CertificateSettingsService as DefaultAdminCourseCertificateSettingsService };
