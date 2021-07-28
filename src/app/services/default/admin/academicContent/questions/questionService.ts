// @import_dependencies_node Import libraries
import { v4 as uuidv4 } from 'uuid';
const ObjectID = require('mongodb').ObjectID
// @end

// @import services
import {questionCategoryService} from '@scnode_app/services/default/admin/academicContent/questions/questionCategoryService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { requestUtility } from "@scnode_core/utilities/requestUtility";
import { mapUtility } from '@scnode_core/utilities/mapUtility';
// @end

// @import models
import { Question } from '@scnode_app/models';
// @end

// @import types
import {IQueryFind, QueryValues} from '@scnode_app/types/default/global/queryTypes'
import {
  IProcessQuestionsData,
  IQuestionFind,
  IQuestionAnswer,
  IQuestion,
  IQuestionDelete,
  IQuestionQuery,
  IQuestionOptions,
  IInstance,
} from '@scnode_app/types/default/admin/academicContent/questions/questionTypes'
// @end

class QuestionService {

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
          const category_exists: any = await questionCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.category.toString()}]})
          if (category_exists.status === 'success') {
            categoryName = category_exists.category.name
          }
        }
      }
    } else if (params.type === 'by_question') {
      if (params.question) {
        const questionIsObjectId = await ObjectID.isValid(params.question)
        if (typeof params.question === 'object' && params.question.question_category) {
          const categoryIsObjectId = await ObjectID.isValid(params.question.question_category)
          if (typeof params.question.question_category === 'string' || categoryIsObjectId) {
            const category_exists: any = await questionCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.question.question_category.toString()}]})
            if (category_exists.status === 'success') {
              categoryName = category_exists.category.name
            }
          } else if (typeof params.question.question_category === 'object' && params.question.question_category.name) {
            categoryName = params.question.question_category.name
          }
        } else if (typeof params.question === 'string' || questionIsObjectId) {
          const academicResource = await Question.findOne({_id: params.question})
          .select('id question_category')
          .populate({path: 'question_category', select: 'name'})
          if (academicResource) {
            categoryName = academicResource.question_category.name
          }
        }
      }
    }

    if (!categoryName) return null

    const service_instance = requestUtility.serviceInstance(`question-${categoryName}`,"default", "admin/academicContent/questions");
    if (service_instance.status === 'error') return responseUtility.buildResponseFailed('json')

    return service_instance['service']
  }

  /**
   * Metodo que se ejecuta antes de almacenar el registro en BD,
   * @param params Elementos a registrar
   * @returns
   */
  public preSave = async (params: IQuestion, options: IQuestionOptions) => {
    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {params}
    })
  }

  /**
   * Metodo que se ejecuta despues de almacenar el registro en BD
   * @param resource Objeto de clase Question
   * @returns
   */
  public postSave = async (question: typeof Question) => {
    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {question}
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

      let select = 'id content value question_category level config answers parent tags metadata owner'
      if (params.query === QueryValues.ALL) {
        const registers = await Question.find(where)
        .select(select)
        .populate({path: 'question_category', select: 'name'})
        .populate({path: 'parent', select: 'id content'})
        // .populate({path: 'tags', select: 'id name'})
        // .populate({path: 'metadata.metadata', select: 'id name'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          questions: registers
        }})
      } else if (params.query === QueryValues.ONE) {
        const register = await Question.findOne(where)
        .select(select)
        .populate({path: 'question_category', select: 'name'})
        .populate({path: 'parent', select: 'id content'})
        // .populate({path: 'tags', select: 'id name'})
        // .populate({path: 'metadata.metadata', select: 'id name'})
        if (!register) return responseUtility.buildResponseFailed('json', null, {error_key: 'question.not_found'})
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          question: register
        }})
      }

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json', null, {error_key: 'question.not_found'})
    }
  }

  /**
  * Metodo que permite insertar/actualizar un registro
  * @param params Elementos a registrar
  * @returns
  */
  public insertOrUpdate = async (params: IQuestion) => {
    try {

      let category;

      if (!params.hasOwnProperty('config')) params.config = {}

      // @INFO: Validando Categoria
      if (params.question_category) {
        const category_exists: any = await questionCategoryService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.question_category}]})
        if (category_exists.status === 'error') return category_exists

        category = category_exists.category
      }

      // @INFO: Validando padre
      if (params.parent) {
        const parent_exists: any = await this.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.parent}]})
        if (parent_exists.status === 'error') return parent_exists
      }

      if (params.answer) {
        if (!params.answer.unique) {
          params.answer.unique = uuidv4()
        }
        const validate = await this.validateAnswerStructure(params.answer)
        if (!validate) return responseUtility.buildResponseFailed('json', null, {error_key: 'question.answers.invalid'})

      } else if (params.answers) {
        let validate = true
        await mapUtility.mapAsync(
          params.answers.map(async (a, i) => {
            if (!a.unique) params.answers[i].unique = uuidv4()
            if (await this.validateAnswerStructure(a) === false) {
              validate = false
            }
          })
        )
        if (!validate) return responseUtility.buildResponseFailed('json', null, {error_key: 'question.answers.invalid'})
      }

      // @INFO: Validando metadata
      // if (params.metadata && Array.isArray(params.metadata) && params.metadata.length > 0) {
      //     const metadataStatus = await metadataService.validateMetadata(params.metadata)
      //     if (!metadataStatus) return responseUtility.buildResponseFailed('json', null, {error_key: 'metadata.structure_invalid'})
      // }

      // @INFO: Validando tags
      // if (params.tags && Array.isArray(params.tags)) {
      //     let tags = []
      //     await mapUtility.mapAsync(
      //         params.tags.map(async (t) => {
      //             const isObjectId = await ObjectID.isValid(t)
      //             if (!isObjectId) {
      //                 const tagExists: any = await questionTagService.findBy([{field: 'name', value: t}, {field: 'alliance_id', value: params.alliance_id}])
      //                 if (tagExists.status === 'success') {
      //                     tags.push(tagExists.questionTag._id)
      //                 } else {
      //                     const newTagResponse: any = await questionTagService.insertOrUpdate({alliance_id: params.alliance_id, name: t})
      //                     if (newTagResponse.status === 'success') {
      //                         tags.push(newTagResponse.questionTag._id)
      //                     }
      //                 }
      //             } else {
      //                 tags.push(t)
      //             }
      //         })
      //     )
      //     params.tags = tags
      // }

      if (params.id) {

        const question = await Question.findOne({_id: params.id})
        if (!question) return responseUtility.buildResponseFailed('json', null, {error_key: 'question.not_found'})

        let update = {...params}

        // @INFO: Precargando valores que no vengan en el crud
        if (question.config) {
          params.config = {...question.config, ...params.config}
        }

        const preSaveResponse: any = await this.preSave(params, {
          question,
          action: 'update'
        })
        if (preSaveResponse.status === 'error') return preSaveResponse

        params = preSaveResponse.params

        update['config'] = params.config

        // @INFO: Actualizando una unica respuesta
        update.answers = await this.mergeAnswers(params, {
          question,
          action: 'update'
        })

        let response = await Question.findByIdAndUpdate(params.id, update, { useFindAndModify: false, new: true })
        // await QuestionTag.populate(response, {path: 'tags', select: 'id name'})
        // await Metadata.populate(response, {path: 'metadata.metadata', select: 'id name'})

        const postSaveResponse: any = await this.postSave(response)
        if (postSaveResponse.status === 'error') return postSaveResponse

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            question: {
              id: response._id,
              content: response.content,
              value: response.value,
              question_category: response.question_category,
              level: response.level,
              answers: response.answers,
              parent: response.parent,
              config: response.config,
              // tags: response.tags,
              // metadata: response.metadata,
              owner: response.owner
            }
          }
        })

      } else {

        const preSaveResponse: any = await this.preSave(params, {
          action: 'new'
        })
        if (preSaveResponse.status === 'error') return preSaveResponse

        params = preSaveResponse.params

        // @INFO: Agregando una unica respuesta
        params.answers = await this.mergeAnswers(params, {
          action: 'new'
        })

        const {id} = await Question.create(params)
        let response = await Question.findOne({_id: id})
        // .populate({path: 'tags', select: 'id name'})
        // .populate({path: 'metadata.metadata', select: 'id name'})

        const postSaveResponse: any = await this.postSave(response)
        if (postSaveResponse.status === 'error') return postSaveResponse

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            question: {
              id: response._id,
              content: response.content,
              value: response.value,
              question_category: response.question_category,
              level: response.level,
              answers: response.answers,
              parent: response.parent,
              config: response.config,
              // tags: response.tags,
              // metadata: response.metadata,
              owner: response.owner
            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json', null, { error_key: 'question.insertOrUpdate.fail_action' })
    }
  }

  /**
  * Metodo que permite hacer borrar un registro
  * @param params Filtros para eliminar
  * @returns
  */
  public delete = async (params: IQuestionDelete) => {
    try {
      const find = await Question.findOne({ _id: params.id })
      if (!find) return responseUtility.buildResponseFailed('json', null, { error_key: 'question.not_found' })

      // TODO: Si una pregunta se borra deberia desactivarse todo lado donde este enlazado o no se debe permitir borrar si ya esta en uso
      await find.delete()

      return responseUtility.buildResponseSuccess('json', null)
    } catch (error) {
      return responseUtility.buildResponseFailed('json', null, { error_key: 'question.delete.fail_action' })
    }
  }

  /**
  * Metodo que permite listar todos los resgistros
  * @param [filters] Estructura de filtros para la consulta
  * @returns
  */
  public list = async (filters: IQuestionQuery = {}) => {
    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber= filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage= filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    let select = 'id content value question_category level config answers parent tags metadata'

    if (filters.select) {
      select = filters.select
    }

    let where = {}

    if(filters.search){
      const search = filters.search
      where = {
        ...where,
        $or:[
          {content: { $regex: '.*' + search + '.*',$options: 'i' }},
          // {description: { $regex: '.*' + search + '.*',$options: 'i' }},
        ]
      }
    }

    let registers = []
    try {
      registers =  await Question.find(where)
      .select(select)
      .populate({path: 'question_category', select: 'name'})
      .populate({path: 'parent', select: 'id content'})
      // .populate({path: 'tags', select: 'id name'})
      // .populate({path: 'metadata.metadata', select: 'id name'})
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        questions: [
          ...registers
        ],
        total_register: (paging) ? (await Question.find(where).countDocuments()) : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
   * Metodo que permite validar la estructura de las respuestas
   * @param answer Objeto de tipo IQuestionAnswer
   * @returns
   */
  protected validateAnswerStructure = async (answer: IQuestionAnswer) => {
    return (!answer.content || typeof answer.value === 'undefined') ? false : true
  }

  /**
   * Metodo que permite unir los objetos de respuesta para su posterior evaluacion y verificación
   * @param params Elementos provenientes del cliente con la data a registrar
   * @param options Opciones de ejecucion
   * @returns
   */
  protected mergeAnswers = async (params: IQuestion, options: IQuestionOptions) => {

    let answers = []

    if (options.action === 'new') {
      if (params.answer) {
        answers = [{...params.answer}]
      } else if (params.answers) {
        answers = [...params.answers]
      }
    } else if (options.action === 'update') {
      if (options.question) answers = [...options.question.answers]

      if (params.answer) {
        let index = answers.findIndex((a) => a.unique.toString() === params.answer.unique.toString())
        if (index !== -1) {
          answers[index] = {...params.answer}
        } else {
          answers.push({...params.answer})
        }
      } else if (params.answers) {
        answers = [...params.answers]
      }
    }

    return answers
  }

  /**
   * Metodo que permite extraer las respuestas correctas
   * @param answers Array de respuestas del usuario
   * @returns
   */
  protected getAnswersCorrected = async (answers: IQuestionAnswer[]) => {
    return answers.filter((a: any) => a.is_correct)
  }

  /**
   * Metodo que permite validar si el valor de las respuestas y la pregunta son coherentes
   * @param params Elementos provenientes del cliente con la data a registrar
   * @param options Opciones de ejecucion
   * @param answers Array de respuestas del usuario
   * @returns
   */
  protected validateValue = async (params: IQuestion, options: IQuestionOptions, answers: IQuestionAnswer[]) => {
    return responseUtility.buildResponseSuccess('json')
  }

  /**
   * Metodo que permite validar si el valor de la pregunta esta presente
   * @param params Elementos provenientes del cliente con la data a registrar
   * @param options Opciones de ejecucion
   * @returns
   */
  protected validateValueRequired = async (params: IQuestion, options: IQuestionOptions) => {
    let value = params.value
    if (options.question && options.question.value && !value) value = options.question.value

    if (!value) return responseUtility.buildResponseFailed('json', null, {error_key: 'question.value_required'})

    return responseUtility.buildResponseSuccess('json')
  }

  /**
   * Metodo que permite procesar la información de las preguntas y generar la data necesaria segun su tipo
   * @param params
   * @returns
   */
  public processQuestionsData =  async (params: IProcessQuestionsData) => {
    let questions = []
    for await (let question of params.questions) {

      // @INFO: Validaciones segun configuración
      if (question.question && question.question.config) {
        if (
          question.question.config.order_of_answers &&
          question.question.config.order_of_answers === 'random'
        ) {
          if (question.question.question_category.name === 'fill-in-spaces') {
            let answer = question.question.answers[0]
            if (answer && answer.config && answer.config.fill_in_spaces) {
              answer.config.fill_in_spaces = mapUtility.shuffle(answer.config.fill_in_spaces)
            }
          } else {
            question.question.answers = mapUtility.shuffle(question.question.answers)
          }
        }
      }

      questions.push(question)
    }
    return questions
  }

}

export const questionService = new QuestionService();
export { QuestionService as DefaultAdminAcademicContentQuestionsQuestionService };
