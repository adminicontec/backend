// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CertificateQueue } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICertificate, ICertificateQueue, ICertificateQueueQuery, ICertificateQueueDelete } from '@scnode_app/types/default/admin/certificate/certificateTypes'
import moment from 'moment';
// @end

interface ParamsCertificateGeneratedByMonth {
  months?: number;    // Numero de meses a filtrar (por defecto últimos 12)
}

class CertificateQueueService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }


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

      let select = 'id courseId userId auxiliar status certificateType certificateModule certificate';
      if (params.query === QueryValues.ALL) {
        const registers = await CertificateQueue.find(where)
          .select(select)
          .populate({ path: 'userId', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen moodle_id' })
          .populate({ path: 'auxiliar', select: 'id email phoneNumber profile.first_name profile.last_name profile.doc_type profile.doc_number profile.regional profile.origen moodle_id' });

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register = await CertificateQueue.findOne(where).select(select)
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'city.not_found' })
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: register
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
  public insertOrUpdate = async (params: ICertificateQueue) => {

    try {
      if (params.id) {
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log("UPDATE certificate queue");
        console.log(params);

        const register = await CertificateQueue.findOne({ _id: params.id })
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate.queue.not_found' })

        const response: any = await CertificateQueue.findByIdAndUpdate(params.id, params, { useFindAndModify: false, new: true })
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++\n\r");

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: {
              _id: response._id,
              status: response.status,
              certificate: response.certificate,
              auxiliar: response.auxiliar
            }
          }
        })

      } else {
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log("INSERT certificate queue");
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        console.log(params);
        console.log("AuxiliarID:" + params.auxiliar);

        let totalResponse = [];

        // Multiple request from List in front
        for await (const userId of params.users) {

          const exist = await CertificateQueue.findOne({ userid: userId, courseid: params.courseId, auxiliar: params.auxiliar })
          if (exist) return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'certificate.queue.already_exists', params: { userid: userId, courseid: params.courseId } } });

          const response: any = await CertificateQueue.create({
            courseId: params.courseId,
            userId: userId,
            auxiliar: params.auxiliar,
            status: params.status,
            certificateType: params.certificateType,
            certificateModule: ''
          });

          let certificateQueueResponse = {
            _id: response.id,
            courseId: response.courseId,
            userId: response.userId,
            auxiliar: response.auxiliar,
            // certificateType: response.certificateType,
            // certificateModule: response.certificateModule,
            status: response.status
          }

          if (params.users.length == 1) {
            return responseUtility.buildResponseSuccess('json', null, {
              additional_parameters: {
                certificateQueue: certificateQueueResponse
              }
            });
          }
          else
            totalResponse.push(certificateQueueResponse);

        };

        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++\n\r");
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            certificateQueue: {
              totalResponse
            }
          }
        });
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json', null,
        {
          additional_parameters: {
            process: 'insertOrUpdate()',
            error: e.message
          }
        })
    }
  }


  /**
   * Metodo que permite listar todos los registros
   * @param [filters] Estructura de filtros para la consulta
   * @returns
   */
  public list = async (filters: ICertificateQueueQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id courseId userId auxiliar status certificateType certificateModule certificate'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.search) {
      const search = filters.search
      where = {
        ...where,
        $or: [
          { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        ]
      }
    }

    let registers = []
    try {
      registers = await CertificateQueue.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        certificateQueue: [
          ...registers
        ],
        total_register: (paging) ? await CertificateQueue.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }


  public fetchItems = async (filters: ICertificateQueueQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id courseId userId auxiliar status certificateType certificateModule certificate'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.search) {
      const search = filters.search
      where = {
        ...where,
        $or: [
          { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        ]
      }
    }

    let registers = []
    try {
      registers = await CertificateQueue.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        certificateQueue: [
          ...registers
        ],
        total_register: (paging) ? await CertificateQueue.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
   * @INFO Obtener el numero de certificados emitidos por mes (últimos 12 meses por defecto)
   * @returns
   */
  public certificateGeneratedByMonth = async (params?: ParamsCertificateGeneratedByMonth) => {
    try {
      // Fechas para filtrar
      const startDate = new Date();
      startDate.setMonth(params.months ? startDate.getMonth() - params.months : startDate.getMonth() - 12);
      const endDate = new Date();

      // Obtener los certificados generados por mes
      const certificatesGeneratedResponse = await CertificateQueue.find({ 'certificate.date': { $gte: startDate, $lt: endDate }, status: 'Complete' });
      let certificatesGenerated: { date_ms: number, certificates: number, dateFormated: string }[] = [];
      if (certificatesGeneratedResponse && certificatesGeneratedResponse?.length) {
        certificatesGeneratedResponse.forEach((certificate: any) => {
          const dateFormated = moment(certificate.certificate.date).format('YYYY-MM');
          const idx = certificatesGenerated.findIndex((cc) => cc.dateFormated === dateFormated);
          if (idx >= 0) {
            certificatesGenerated[idx].certificates += 1;
          } else {
            certificatesGenerated.push({
              date_ms: (new Date(certificate.certificate.date)).getTime(),
              certificates: 1,
              dateFormated
            });
          }
        });
      }

      // Ordenar el array
      certificatesGenerated = certificatesGenerated.sort((a, b) => a.date_ms - b.date_ms);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          certificatesGenerated,
        }
      })
    } catch (e) {
      console.log('courseSchedulingDataService => schedulingConfirmedByMonth error: ', e);
      return responseUtility.buildResponseFailed('json');
    }
  }


  /**
* Metodo que permite hacer borrar un registro
* @param params Filtros para eliminar
* @returns
*/
  public delete = async (params: ICertificateQueueDelete) => {
    try {
      const find = await CertificateQueue.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'certificate.queue.not_found' })

      await find.delete()

      return responseUtility.buildResponseSuccess('json')
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const certificateQueueService = new CertificateQueueService();
export { CertificateQueueService as DefaultAdminCertificateQueueCertificateQueueService };
