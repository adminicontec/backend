// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import { ExceptionsService } from '@scnode_app/helpers/errors';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CertificateCriteriaByModality, CourseSchedulingMode } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes';
import { ICertificateCriteriaByModality, ICertificateCriteriaByModalityDelete, ICertificateCriteriaByModalityQuery } from '@scnode_app/types/default/admin/certificate/certificateCriteriaByModalityTypes';
import { TypeCourse } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
// @end

class CertificateCriteriaByModalityService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

   /**
   * Metodo que permite insertar/actualizar un registro
   * @param params Elementos a registrar
   * @returns
   */
   public insertOrUpdate = async (params: ICertificateCriteriaByModality) => {

    try {
      const {user, id, ...rest} = params
      if (params?.modality) {
        const isValid = await ObjectID.isValid(params.modality)
        if (!isValid) throw new ExceptionsService({message: 'La modalidad no es valida', code: 400})
        const existsModality = await CourseSchedulingMode.find({_id: params.modality })
        if (!existsModality) throw new ExceptionsService({message: 'La modalidad no existe o no es valida', code: 400})
      }

      if (params?.typeCourse) {
        if (!Object.values(TypeCourse).includes(params.typeCourse)) {
          throw new ExceptionsService({message: `El tipo de curso proporcionado no es valido. Solo se permiten los siguientes valores - ${Object.values(TypeCourse).join(',')}`, code: 400})
        }
      }
      if (id) {
        const register = await CertificateCriteriaByModality.findOne({_id: id})
        if (!register) throw new ExceptionsService({message: 'El registro no ha sido encontrado', code: 400})

        if (Object.keys(rest).length === 0) throw new ExceptionsService({message: 'No se ha proporcionado nada para actualizar', code: 400})

        const whereCheck = {
          modality: register.modality,
          typeCourse: register?.typeCourse || undefined,
          _id: {$ne: id}
        }
        if (params?.modality) whereCheck['modality'] = params.modality
        if (params?.typeCourse) whereCheck['typeCourse'] = params.typeCourse

        const alreadyExists = await CertificateCriteriaByModality.findOne(whereCheck)
        if (alreadyExists) throw new ExceptionsService({message: 'Ya existe un registro para esta modalidad', code: 400})

        const response: any = await CertificateCriteriaByModality.findByIdAndUpdate(id, rest, { useFindAndModify: false, new: true })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            register: {...response._doc}
          }
        })

      } else {
        const whereCheck = {
          modality: params.modality,
        }
        if (params.typeCourse) {
          whereCheck['typeCourse'] = params.typeCourse
        } else {
          whereCheck['typeCourse'] = { $nin: [TypeCourse.MOOC, TypeCourse.FREE] }
        }
        const alreadyExists = await CertificateCriteriaByModality.findOne(whereCheck)
        if (alreadyExists) throw new ExceptionsService({message: 'Ya existe un registro para esta modalidad', code: 400})
        const response: any = await CertificateCriteriaByModality.create(params)
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            register: {...response._doc}
          }
        })
      }
    } catch (e) {
      return responseUtility.buildResponseFailed('json', null, {
        message: e?.message || undefined,
        code: e?.code || undefined,
      })
    }
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: ICertificateCriteriaByModalityDelete) => {
    try {
      const find: any = await CertificateCriteriaByModality.findOne({ _id: params.id })
      if (!find) throw new ExceptionsService({message: 'El registro no ha sido encontrado', code: 400})

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json', null, {
        message: error?.message || undefined,
        code: error?.code || undefined,
      })
    }
  }

  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (filters: ICertificateCriteriaByModalityQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id modality typeCourse certificateCriteria'
    if (filters.select) select = filters.select

    let where = {}

    let registers = []
    try {
      registers =  await CertificateCriteriaByModality.find(where)
      .select(select)
      .populate({path: 'modality', select: 'id name'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        registers: [
          ...registers
        ],
        total_register: (paging) ? await CertificateCriteriaByModality.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

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

      let select = 'id modality typeCourse certificateCriteria'
      if (params.query === QueryValues.ALL) {
        const registers = await CertificateCriteriaByModality.find(where)
        .populate({path: 'modality', select: 'id name'})
        .select(select)
        .lean()
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          registers: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await CertificateCriteriaByModality.findOne(where)
        .populate({path: 'modality', select: 'id name'})
        .select(select)
        .lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'program.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          register
        }})
      }
      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const certificateCriteriaByModalityService = new CertificateCriteriaByModalityService();
export { CertificateCriteriaByModalityService as DefaultAdminCertificateCertificateCriteriaByModalityService };
