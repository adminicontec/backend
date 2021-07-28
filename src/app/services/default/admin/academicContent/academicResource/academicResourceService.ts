// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import {academicResourceCategoryService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceCategoryService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { requestUtility } from "@scnode_core/utilities/requestUtility";
import { mapUtility } from '@scnode_core/utilities/mapUtility';
// @end

// @import models
import {AcademicResource} from '@scnode_app/models'
// @end

// @import types
import {QueryValues, IQueryFind} from '@scnode_app/types/default/global/queryTypes'
import {
  IAcademicResources,
  IAcademicResource,
  IAcademicResourceDelete,
  IAcademicResourceQuery,
  IAcademicResourceOptions,
  IAcademicResourceQuestions,
  IInstance,
} from '@scnode_app/types/default/admin/academicContent/academicResource/academicResourceTypes'
// @end

class AcademicResourceService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite obtener una instancia del recurso segun su tipo
   * @param params Data para generar la instancia
   * @returns
   */
  public getInstance = async (params: IInstance) => {

    let categoryName= null
    if (params.type === 'by_category') {
      if (params.category) {
        const categoryIsObjectId = await ObjectID.isValid(params.category)
        if (typeof params.category === 'object' && params.category.name) {
          categoryName = params.category.name
        } else if (typeof params.category === 'string' || categoryIsObjectId) {
          const category_exists: any = await academicResourceCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.category.toString()}]})
          if (category_exists.status === 'success') {
            categoryName = category_exists.category.name
          }
        }
      }
    } else if (params.type === 'by_resource') {
      if (params.resource) {
        const resourceIsObjectId = await ObjectID.isValid(params.resource)
        if (typeof params.resource === 'object' && params.resource.academic_resource_category) {
          const categoryIsObjectId = await ObjectID.isValid(params.resource.academic_resource_category)
          if (typeof params.resource.academic_resource_category === 'string' || categoryIsObjectId) {
            const category_exists: any = await academicResourceCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.resource.academic_resource_category.toString()}]})
            if (category_exists.status === 'success') {
              categoryName = category_exists.category.name
            }
          } else if (typeof params.resource.academic_resource_category === 'object' && params.resource.academic_resource_category.name) {
            categoryName = params.resource.academic_resource_category.name
          }
        } else if (typeof params.resource === 'string' || resourceIsObjectId) {
          const academicResource = await AcademicResource.findOne({_id: params.resource})
          .select('id academic_resource_category')
          .populate({path: 'academic_resource_category', select: 'name'})
          if (academicResource) {
            categoryName = academicResource.academic_resource_category.name
          }
        }
      }
    }

    if (!categoryName) return null

    const service_instance = requestUtility.serviceInstance(`academic-resource-${categoryName}`,"default", "admin/academicContent/academicResource");
    if (service_instance.status === 'error') return responseUtility.buildResponseFailed('json')

    return service_instance['service']
}

/**
 * Metodo que permite calcular la duración de un recurso segun su tipo
 * @param params Elementos a registrar
 * @returns
 */
public calculateDuration = async (params: IAcademicResource, options: IAcademicResourceOptions) => {
  const duration = (params.config && params.config.duration) ? params.config.duration : 0
  return responseUtility.buildResponseSuccess('json', null, {
    additional_parameters: {
      duration
    }
  })
}

/**
 * Metodo que se ejecuta antes de almacenar el registro en BD,
 * @param params Elementos a registrar
 * @returns
 */
public preSave = async (params: IAcademicResource, options: IAcademicResourceOptions) => {
  return responseUtility.buildResponseSuccess('json', null, {
    additional_parameters: {
      params
    }
  })
}

/**
 * Metodo que se ejecuta despues de almacenar el registro en BD
 * @param resource Objeto de clase AcademicResource
 * @returns
 */
public postSave = async (resource: typeof AcademicResource) => {
  return responseUtility.buildResponseSuccess('json', null, {
    additional_parameters: {
      resource
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

    let select = 'id title description academic_resource_category alliance_id config metadata tags'
    if (params.query === QueryValues.ALL) {
      const registers = await AcademicResource.find(where)
      .select(select)
      .populate({path: 'academic_resource_category', select: 'name'})
      // .populate({path: 'metadata.metadata', select: 'id name'})
      // .populate({path: 'tags', select: 'id name'})
      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        academicResources: registers
      }})
    } else if (params.query === QueryValues.ONE) {
      const register = await AcademicResource.findOne(where)
      .select(select)
      .populate({path: 'academic_resource_category', select: 'name'})
      // .populate({path: 'metadata.metadata', select: 'id name'})
      // .populate({path: 'tags', select: 'id name'})
      if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResource.not_found'})
      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        academicResource: register
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
public insertOrUpdate = async (params: IAcademicResource) => {
  try {

    let category;

    if (!params.hasOwnProperty('config')) params.config = {}

    // @INFO: Validando Categoria
    if (params.academic_resource_category) {
      const category_exists: any = await academicResourceCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.academic_resource_category}]})
      if (category_exists.status === 'error') return category_exists

      category = category_exists.category
    }

    // // @INFO: Validando metadata
    // if (params.metadata && Array.isArray(params.metadata) && params.metadata.length > 0) {
    //   const metadataStatus = await metadataService.validateMetadata(params.metadata)
    //   if (!metadataStatus) return responseUtility.buildResponseFailed('json', null, {error_key: 'metadata.structure_invalid'})
    // }

    // if (params.tags && Array.isArray(params.tags)) {
    //   let tags = []
    //   await mapUtility.mapAsync(
    //     params.tags.map(async (t) => {
    //       const isObjectId = await ObjectID.isValid(t)
    //       if (!isObjectId) {
    //         const tagExists: any = await academicResourceTagService.findBy([{field: 'name', value: t}, {field: 'alliance_id', value: params.alliance_id}])
    //         if (tagExists.status === 'success') {
    //           tags.push(tagExists.tag._id)
    //         } else {
    //           const newTagResponse: any = await academicResourceTagService.insertOrUpdate({alliance_id: params.alliance_id, name: t})
    //           if (newTagResponse.status === 'success') {
    //             tags.push(newTagResponse.tag._id)
    //           }
    //         }
    //       } else {
    //         tags.push(t)
    //       }
    //     })
    //   )
    //   params.tags = tags
    // }

    if (params.id) {

      const resource = await AcademicResource.findOne({_id: params.id})
      if (!resource) return responseUtility.buildResponseFailed('json', null, {error_key: 'academicResource.not_found'})

      let update = {...params}

      // @INFO: Precargando valores que no vengan en el crud
      if (resource.config) {
        params.config = {...resource.config, ...params.config}
      }

      const preSaveResponse: any = await this.preSave(params, {
        resource,
        action: 'update'
      })
      if (preSaveResponse.status === 'error') return preSaveResponse

      params = preSaveResponse.params

      update['config'] = params.config

      let response = await AcademicResource.findByIdAndUpdate(params.id, update, { useFindAndModify: false, new: true, lean: true })
      // await Metadata.populate(response, {path: 'metadata.metadata', select: 'id name'})
      // await AcademicResourceTag.populate(response, {path: 'tags', select: 'id name'})

      const postSaveResponse: any = await this.postSave(response)
      if (postSaveResponse.status === 'error') return postSaveResponse

      response = postSaveResponse.resource

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          academicResource: {
            id: response._id,
            title: response.title,
            description: response.description,
            academic_resource_category: response.academic_resource_category,
            config: response.config,
            // metadata: response.metadata,
            // tags: response.tags,
          }
        }
      })

    } else {

      const preSaveResponse: any = await this.preSave(params, {
        action: 'new'
      })
      if (preSaveResponse.status === 'error') return preSaveResponse

      params = preSaveResponse.params

      const {id} = await AcademicResource.create(params)
      let response = await AcademicResource.findOne({_id: id})
      // .populate({path: 'metadata.metadata', select: 'id name'})
      // .populate({path: 'tags', select: 'id name'})
      .lean()

      const postSaveResponse: any = await this.postSave(response)
      if (postSaveResponse.status === 'error') return postSaveResponse

      response = postSaveResponse.resource

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          academicResource: {
            id: response._id,
            title: response.title,
            description: response.description,
            academic_resource_category: response.academic_resource_category,
            config: response.config,
            // metadata: response.metadata,
            // tags: response.tags
          }
        }
      })
    }

  } catch (e) {
    return responseUtility.buildResponseFailed('json', null, { error_key: 'academicResource.insertOrUpdate.fail_action' })
  }
}

/**
* Metodo que permite hacer borrar un registro
* @param params Filtros para eliminar
* @returns
*/
public delete = async (params: IAcademicResourceDelete) => {
  try {
    const find = await AcademicResource.findOne({ _id: params.id })
    if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'academicResource.not_found' })

    // TODO: Si un recurso se borra deberia desactivarse todo lado donde este enlazado o no se debe permitir borrar si ya esta en uso
    await find.delete()

    return responseUtility.buildResponseSuccess('json', null)
  } catch (error) {
    return responseUtility.buildResponseFailed('json')
  }
}

/**
* Metodo que permite listar todos los resgistros
* @param [filters] Estructura de filtros para la consulta
* @returns
*/
public list = async (filters: IAcademicResourceQuery = {}) => {
  const paging = (filters.pageNumber && filters.nPerPage) ? true : false
  const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
  const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

  let select = 'id title description academic_resource_category alliance_id config metadata tags'
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
        {description: { $regex: '.*' + search + '.*',$options: 'i' }},
      ]
    }
  }else{
    delete filters.search
  }

  let registers = []
  try {
    registers =  await AcademicResource.find(where)
    .select(select)
    .populate({ path: 'academic_resource_category', select: 'name'})
    // .populate({path: 'metadata.metadata', select: 'id name'})
    // .populate({path: 'tags', select: 'id name'})
    .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
    .limit(paging ? nPerPage : null)
  } catch (e) {}

  return responseUtility.buildResponseSuccess('json', null, {
    additional_parameters: {
      academic_resources: [
        ...registers
      ],
      total_register: (paging) ? await AcademicResource.find(where).countDocuments() : 0,
      pageNumber: pageNumber,
      nPerPage: nPerPage
    }
  })
}

/**
 * Metodo que permite obtener la duración de un recurso segun los parametros
 * @param params Elementos provenientes del cliente con la data a registrar
 * @param options Opciones de ejecucion
 * @returns
 */
protected getResourceDuration = (params: IAcademicResource, options: IAcademicResourceOptions) => {

  let duration = (params.config && params.config.duration) ? parseInt(params.config.duration) : 0
  if (options.resource && options.resource.config && options.resource.config.duration && !duration) duration = parseInt(options.resource.config.duration)

  if (typeof duration !== 'number' || isNaN(duration)) duration = 0

  return duration
}

/**
 * Metodo que permite validar la estructura de preguntas
 * @param questions Array de clase IAcademicResourceQuestions
 * @returns
 */
protected validateQuestionsStructure = async (questions: IAcademicResourceQuestions[]) => {
  let isValid = true
  await mapUtility.mapAsync(
    questions.map(async (q) => {
      if (await this.validateQuestionStructure(q) === false) {
        isValid = false
      }
    })
  )
  return isValid
}

/**
 * Metodo que permite validar la estructura de una pregunta
 * @param question Objeto de clase IAcademicResourceQuestions
 * @returns
 */
protected validateQuestionStructure = async (question: IAcademicResourceQuestions) => {
  return (!question.question) ? false : true
}

/**
 * Metodo que permite unir las preguntas "Container" con sus respectivos hijos
 * @param questions Array con las preguntas a verificar
 * @returns
 */
public mergeContainerQuestions = async (questions: Array<any>) => {

  let newQuestions = []
  let childs = {}

  for await (let question of questions) {
    let questionAux = (question.question) ? question.question : question
    if (questionAux && questionAux.parent) {
      if (!childs[questionAux.parent.toString()]) childs[questionAux.parent.toString()] = []
      childs[questionAux.parent.toString()].push(question)
    }
  }

  for await (let question of questions) {
    let questionAux = (question.question) ? question.question : question
    if (!questionAux.parent) {
      if (questionAux && questionAux.question_category && questionAux.question_category.name === 'container') {
        question['childs'] = []
        if (childs[questionAux._id.toString()]) {
          question['childs'] = childs[questionAux._id.toString()]
        }
      }
      newQuestions.push(question)
    }
  }

  return newQuestions
}

/**
 * Metodo que permite unir a las preguntas sus correspondientes padres "Container"
 * @param questions Array con las preguntas a verificar
 * @returns
 */
public addContainerInQuestions = async (questions: Array<any>) => {

  let newQuestions = []
  let parents = {}

  for await (let question of questions) {
    let questionAux = (question.question) ? question.question : question
    if (!questionAux.parent) {
      if (questionAux && questionAux.question_category && questionAux.question_category.name === 'container') {
        if (!parents[questionAux._id.toString()]) parents[questionAux._id.toString()] = {}
        parents[questionAux._id.toString()] = question
      }
    }
  }

  for await (let question of questions) {
    let questionAux = (question.question) ? question.question : question
    if (!questionAux.parent) {
      if (questionAux && questionAux.question_category && questionAux.question_category.name !== 'container') {
        newQuestions.push(question)
      }
    } else {
      question['container'] = {}
      if (parents[questionAux.parent.toString()]) {
        question['container'] = parents[questionAux.parent.toString()]
      }
      newQuestions.push(question)
    }
  }

  return newQuestions
}
}

export const academicResourceService = new AcademicResourceService();
export { AcademicResourceService as DefaultAdminAcademicContentAcademicResourceAcademicResourceService };
