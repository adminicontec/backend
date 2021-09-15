// @import_dependencies_node Import libraries
// @end

// @import services
import { uploadService } from '@scnode_core/services/default/global/uploadService'
// @end

// @import config
import { customs } from '@scnode_core/config/globals'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { Landing } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import {
  ILanding,
  ILandingDelete,
  ILandingQuery,
  ILandingArticle,
  ILandingTrainings,
  ILandingTrainingsDelete,
  ILandingSchedulingDelete,
  ILandingScheduling,
  ILandingDescriptiveTraining,
  ILandingOurClientDelete,
  ILandingOurClients
} from '@scnode_app/types/default/admin/landing/landingTypes'
// @end

class LandingService {

  private default_cover_article_path = 'landings/article'
  private default_cover_training_path = 'landings/training'
  private default_cover_scheduling_path = 'landings/scheduling'
  private default_cover_descriptive_training_path = 'landings/descriptiveTraining'
  private default_cover_our_clients_path = 'landings/ourClients'

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

      let select = 'id slug title_page article trainings scheduling'
      if (params.query === QueryValues.ALL) {
        const registers: any = await Landing.find(where)
          .select(select)
          .lean()

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            landings: registers
          }
        })
      } else if (params.query === QueryValues.ONE) {
        const register: any = await Landing.findOne(where)
          .select(select)
          .lean()

        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'landing.not_found' })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            landing: register
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
  public insertOrUpdate = async (params: ILanding) => {

    // @INFO: Validando que la landing sea unica según slug
    const exist = await Landing.findOne({ slug: params.slug }).select('id')
    if (exist) params.id = exist._id

    try {
      if (params.id) {
        const register: any = await Landing.findOne({ _id: params.id }).lean()
        if (!register) return responseUtility.buildResponseFailed('json', null, { error_key: 'landing.not_found' })

        const response: any = await Landing.findByIdAndUpdate(params.id, params, {
          useFindAndModify: false,
          new: true,
          lean: true,
        })

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          landing: {
            ...response,
          }
        }})
      } else {

        // @INFO: Validando que la landing sea unica según slug
        const exist = await Landing.findOne({slug: params.slug}).select('id')
        if (exist) return responseUtility.buildResponseFailed('json', null, {error_key: {key: 'landing.insertOrUpdate.already_exists', params: {slug: params.slug}}})

        const { _id } = await Landing.create(params)
        const response: any = await Landing.findOne({ _id })
            .lean()

        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          landing: {
            ...response
          }
        }})
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite insertar/actualizar un articulo dentro de un landing
   * @param params
   * @returns
   */
  public insertOrUpdateArticle = async (params: ILandingArticle) => {

    try {
      // let article: ILandingArticle
      // const exist = await Landing.findOne({ slug: params.slug }).select('id article').lean()
      // if (exist) article = {...exist.article}

      // @INFO: Cargando imagen al servidor
      if (params.coverFile && params.coverFile !== '{}') {
        const defaulPath = this.default_cover_article_path
        const response_upload: any = await uploadService.uploadFile(params.coverFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.coverUrl = response_upload.name
      }

      return await this.insertOrUpdate({
        slug: params.slug,
        article: {
          // ...article,
          ...params
        }
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite insertar/actualizar una capacitación dentro de un landing
   * @param params
   * @returns
   */
  public insertOrUpdateTraining = async (params: ILandingTrainings) => {

    try {
      let trainings: Array<ILandingTrainings> = []
      const exists = await Landing.findOne({ slug: params.slug }).select('id trainings').lean()
      if (exists) {
        trainings = exists.trainings
      }

      // @INFO: Cargando imagen al servidor
      if (params.attachedFile && params.attachedFile !== '{}') {
        const defaulPath = this.default_cover_training_path
        const response_upload: any = await uploadService.uploadFile(params.attachedFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.attachedUrl = response_upload.name
      }

      let trainingExists = trainings.findIndex((t) => t.unique === params.unique)
      if (trainingExists !== -1) {
        trainings[trainingExists] = {...params}
      } else {
        trainings.push({
          ...params
        })
      }

      return await this.insertOrUpdate({
        slug: params.slug,
        trainings: trainings
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite eliminar una capacitación de un landing
   * @param params
   * @returns
   */
   public deleteTraining = async (params: ILandingTrainingsDelete) => {

    try {
      let trainings: Array<ILandingTrainings> = []
      const exists = await Landing.findOne({ slug: params.slug }).select('id trainings').lean()
      if (exists) {
        trainings = exists.trainings
      }

      let trainingExists = trainings.findIndex((t) => t.unique === params.unique)
      if (trainingExists === -1) {
        return responseUtility.buildResponseFailed('json', null, {error_key: 'landing.trainings.delete.not_found'})
      } else {
        trainings.splice(trainingExists, 1)
      }

      return await this.insertOrUpdate({
        slug: params.slug,
        trainings: trainings
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite insertar/actualizar una programación dentro de un landing
   * @param params
   * @returns
   */
  public insertOrUpdateScheduling = async (params: ILandingScheduling) => {

    try {
      let schedulings: Array<ILandingScheduling> = []
      const exists = await Landing.findOne({ slug: params.slug }).select('id scheduling').lean()
      if (exists) {
        schedulings = exists.scheduling
      }

      // @INFO: Cargando imagen al servidor
      if (params.attachedFile && params.attachedFile !== '{}') {
        const defaulPath = this.default_cover_scheduling_path
        const response_upload: any = await uploadService.uploadFile(params.attachedFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.attachedUrl = response_upload.name
      }

      let schedulingExists = schedulings.findIndex((t) => t.unique === params.unique)
      if (schedulingExists !== -1) {
        schedulings[schedulingExists] = {...params}
      } else {
        schedulings.push({
          ...params
        })
      }

      return await this.insertOrUpdate({
        slug: params.slug,
        scheduling: schedulings
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite eliminar una programación de un landing
   * @param params
   * @returns
   */
   public deleteScheduling = async (params: ILandingSchedulingDelete) => {

    try {
      let schedulings: Array<ILandingScheduling> = []
      const exists = await Landing.findOne({ slug: params.slug }).select('id scheduling').lean()
      if (exists) {
        schedulings = exists.scheduling
      }

      let schedulingExists = schedulings.findIndex((t) => t.unique === params.unique)
      if (schedulingExists === -1) {
        return responseUtility.buildResponseFailed('json', null, {error_key: 'landing.scheduling.delete.not_found'})
      } else {
        schedulings.splice(schedulingExists, 1)
      }

      return await this.insertOrUpdate({
        slug: params.slug,
        scheduling: schedulings
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite insertar/actualizar un cliente
   * @param params
   * @returns
   */
  public insertOrUpdateOurClient = async (params: ILandingOurClients) => {

    try {
      let ourClients: Array<ILandingOurClients> = []
      const exists = await Landing.findOne({ slug: params.slug }).select('id our_clients').lean()
      if (exists && exists.our_clients) {
        ourClients = exists.our_clients
      }else{
        ourClients = []
      }

      // @INFO: Cargando imagen al servidor
      if (params.attachedFile && params.attachedFile !== '{}' && typeof params.attachedFile !== 'string') {
        const defaulPath = this.default_cover_our_clients_path
        const response_upload: any = await uploadService.uploadFile(params.attachedFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.url = response_upload.name
      }

      let ourClientsExists = ourClients.findIndex((t) => t.unique === params.unique)
      if (ourClientsExists !== -1) {
        ourClients[ourClientsExists] = {...ourClients[ourClientsExists], ...params}
      } else {
        ourClients.push({
          ...params
        })
      }

      return await this.insertOrUpdate({
        slug: params.slug,
        our_clients: ourClients
      })
    } catch (e) {
      console.log(e)
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite eliminar un cliente
   * @param params
   * @returns
   */
   public deleteOurClient = async (params: ILandingOurClientDelete) => {

    try {
      let ourClients: Array<ILandingOurClients> = []
      const exists = await Landing.findOne({ slug: params.slug }).select('id our_clients').lean()
      if (exists && exists.our_clients) {
        ourClients = exists.our_clients
      }else{
        ourClients = []
      }

      let ourClientsExists = ourClients.findIndex((t) => t.unique === params.unique)
      if (ourClientsExists === -1) {
        return responseUtility.buildResponseFailed('json', null, {error_key: 'landing.scheduling.delete.not_found'})
      } else {
        ourClients.splice(ourClientsExists, 1)
      }

      return await this.insertOrUpdate({
        slug: params.slug,
        our_clients: ourClients
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite insertar/actualizar la formación descriptiva dentro de un landing
   * @param params
   * @returns
   */
  public insertOrUpdateDescriptiveTraining = async (params: ILandingDescriptiveTraining) => {

    try {
      let descriptiveTraining: ILandingDescriptiveTraining = {}
      let landingId: string | undefined = undefined
      const exists = await Landing.findOne({ slug: params.slug }).select('id descriptive_training').lean()
      if (exists) {
        descriptiveTraining = exists.descriptive_training
        landingId = exists._id
      }


      // @INFO: Cargando imagen al servidor
      if (params.attachedFile && params.attachedFile !== '{}' && typeof params.attachedFile !== 'string') {
        const defaulPath = this.default_cover_descriptive_training_path
        const response_upload: any = await uploadService.uploadFile(params.attachedFile, defaulPath)
        if (response_upload.status === 'error') return response_upload
        if (response_upload.hasOwnProperty('name')) params.image = response_upload.name
      }

      return await this.insertOrUpdate({
        slug: params.slug,
        descriptive_training: {
          ...descriptiveTraining,
          ...params
        },
        id: landingId
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite hacer borrar un registro
   * @param params Filtros para eliminar
   * @returns
   */
  public delete = async (params: ILandingDelete) => {
    try {
      const find: any = await Landing.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'landing.not_found' })

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
  public list = async (filters: ILandingQuery = {}) => {

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false

    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id slug title_page article trainings scheduling'
    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if (filters.search) {
      const search = filters.search
      where = {
        ...where,
        $or: [
          { observations: { $regex: '.*' + search + '.*', $options: 'i' } }
        ]
      }
    }

    let registers = []
    try {
      registers = await Landing.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort({ created_at: -1 })
        .lean()

      // for await (const register of registers) {
      //   if (register.startDate) register.startDate = moment.utc(register.startDate).format('YYYY-MM-DD')
      //   if (register.endDate) register.endDate = moment.utc(register.endDate).format('YYYY-MM-DD')
      //   if (register.metadata) {
      //     if (register.metadata.user) {
      //       register.metadata.user.fullname = `${register.metadata.user.profile.first_name} ${register.metadata.user.profile.last_name}`
      //     }
      //   }
      //   // if (register.teacher && register.teacher.profile) {
      //   //   register.teacher.fullname = `${register.teacher.profile.first_name} ${register.teacher.profile.last_name}`
      //   // }
      // }
    } catch (e) { }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        landings: [
          ...registers
        ],
        total_register: (paging) ? await Landing.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
   * Metodo que convierte el valor del cover de un articulo a la URL donde se aloja el recurso
   * @param {config} Objeto con data
   */
  public articleCoverUrl = ({ coverUrl }) => {
    return coverUrl && coverUrl !== ''
    ? `${customs['uploads']}/${this.default_cover_article_path}/${coverUrl}`
    : null
  }

  /**
   * Metodo que convierte el valor del cover de un articulo a la URL donde se aloja el recurso
   * @param {config} Objeto con data
   */
   public trainingAttachedUrl = ({ attachedUrl }) => {
    return attachedUrl && attachedUrl !== ''
    ? `${customs['uploads']}/${this.default_cover_training_path}/${attachedUrl}`
    : null
  }

  /**
   * Metodo que convierte el valor del cover de un articulo a la URL donde se aloja el recurso
   * @param {config} Objeto con data
   */
   public schedulingAttachedUrl = ({ attachedUrl }) => {
    return attachedUrl && attachedUrl !== ''
    ? `${customs['uploads']}/${this.default_cover_scheduling_path}/${attachedUrl}`
    : null
  }

  /**
   * Metodo que convierte el valor del cover de un articulo a la URL donde se aloja el recurso
   * @param {config} Objeto con data
   */
   public descriptiveTrainingImageUrl = (img: string) => {
    return img
    ? `${customs['uploads']}/${this.default_cover_descriptive_training_path}/${img}`
    : null
  }

  /**
   * Metodo que convierte el valor del cover de un articulo a la URL donde se aloja el recurso
   * @param {config} Objeto con data
   */
   public ourClientsImageUrl = (img: string) => {
    return img
    ? `${customs['uploads']}/${this.default_cover_our_clients_path}/${img}`
    : null
  }

}

export const landingService = new LandingService();
export { LandingService as DefaultAdminLandingLandingService };
