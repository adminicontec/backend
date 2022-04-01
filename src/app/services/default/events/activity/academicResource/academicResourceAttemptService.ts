// @import_dependencies_node Import libraries
import moment from 'moment'
// @end

// @import services
import { academicResourceConfigService } from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceConfigService'
import { userService } from '@scnode_app/services/default/admin/user/userService'
// import { academicResourceQualificationService } from '@scnode_app/services/default/lms/academicContent/events/academicResource/qualification/academicResourceQualificationService'
import { academicResourceDataAttemptService } from '@scnode_app/services/default/data/academicContent/academicResource/academicResourceDataAttemptService'
import { surveyLogService } from '@scnode_app/services/default/admin/survey/surveyLogService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {AcademicResourceAttempt} from '@scnode_app/models'
// @end

// @import types
import { QueryValues } from '@scnode_app/types/default/global/queryTypes';
import {
  IAcademicResourceAttempResultsAnswers,
  IAcademicResourceAttempResults,
  IAcademicResourceAttempt,
  IEnableAcademicResourceAttempt,
} from '@scnode_app/types/default/events/activity/academicResource/academicResourceAttemptTypes'
// @end

class AcademicResourceAttemptService {

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
  public insertOrUpdate = async (params: IAcademicResourceAttempt, files: any) => {
    try {
      let user = null
      let academic_resource_config = null
      let newStatistics = null

      if (!params.hasOwnProperty('results')) params.results = {}

      // @INFO: Validando usuario
      const user_exists: any = await userService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: params.user}]})
      if (user_exists.status === 'error') return user_exists
      user = user_exists.user

      // @INFO: Validando la configuración del recurso
      const academic_resource_config_exists: any = await academicResourceConfigService.findBy({query: QueryValues.ONE, where: [{ field: '_id', value: params.academic_resource_config }]})
      if (academic_resource_config_exists.status === 'error') return academic_resource_config_exists

      academic_resource_config = academic_resource_config_exists.academicResourceConfig

      let attempt = null
      let timeView = 0

      if (params.results && params.results.time_taken) {
        timeView = params.results.time_taken
        delete params.results.time_taken
      }

      // @INFO: Validaciones segun la configuración de lanzamiento
      if (
        academic_resource_config &&
        academic_resource_config.config
      ) {
        // @INFO: Segun la configuración de lanzamiento del recurso se determina la cantidad de intentos
        if (
          academic_resource_config.config.max_attemps &&
          academic_resource_config.config.max_attemps > 0 &&
          !params.force
        ) {
          const number_of_attempts = await academicResourceDataAttemptService.getNumberAttemptsEnded({
            user: params.user,
            academic_resource_config: academic_resource_config._id
          })

          // @INFO: Si la configuración de lanzamiento indica un maximo de intentos se debe validar
          if (number_of_attempts >= academic_resource_config.config.max_attemps) return responseUtility.buildResponseFailed('json', null, { error_key: 'academicResource.fetchAcademicResourceData.config.max_attemps' })
        }
      }

      const validStatus = ['started', 'loop']

      //@INFO: Validando si viene una calificación contar los terminados para actualizar
      if (params.results && params.results.qualification && params.results.qualification.score) validStatus.push('ended')

      // @INFO Si tiene un adjunto lo subo
      let newFile: any = undefined
      // if (files && Object.prototype.hasOwnProperty.call(files, 'file')) {
      //   const response_upload: any = await uploadService.uploadFile(
      //     files['file'],
      //     this.academicResourceAttemptFileUrl
      //   )
      //   if (response_upload.status === "error")
      //     return response_upload

      //   if (response_upload.hasOwnProperty("name")) {
      //     newFile = {
      //       name: files['file'].name,
      //       filename: response_upload.name
      //     }
      //   }
      // }

      // @INFO: Generando registro principal de log
      let queryAttempt = {
        user: params.user,
        academic_resource_config: params.academic_resource_config,
        'results.status': { $in: validStatus }
      }

      const attemptExists = await AcademicResourceAttempt.findOne(queryAttempt).lean()

      if (!attemptExists) {
        let createQueryAttempt = {
          user: params.user,
          academic_resource_config: params.academic_resource_config
        }
        attempt = await AcademicResourceAttempt.create(createQueryAttempt)
      } else {
        attempt = attemptExists
      }

      let results: IAcademicResourceAttempResults = {}

      // @INFO: Precargando valores que no vengan en el crud
      if (attempt.results) {
        results = { ...attempt.results }
      }

      if (params.results.questionsToEvaluate && params.results.questionsToEvaluate.length > 0) results.questionsToEvaluate = params.results.questionsToEvaluate
      if (params.results.questionsByConfiguration) results.questionsByConfiguration = params.results.questionsByConfiguration

      // @INFO: Agregar los adjuntos
      if(results && Array.isArray(results.files) ){
        if(results.files.length < 3 && newFile){
          results.files.push(newFile)
        }
      }

      if (params.results.score) results.score = params.results.score
      if (params.results.status) results.status = params.results.status
      if (params.results.surveyRelated) {
        results.surveyRelated = params.results.surveyRelated
        // @INFO Actualizar el log de la encuesta
        await surveyLogService.addAttempt({
          surveyRelated: params.results.surveyRelated,
          userId: params.user
        });
      }

      results.time_taken += timeView

      if (params.results.statistics) {
        results.statistics = params.results.statistics
      } else if (params.results.answer) {
        let index = results.statistics.findIndex((a) => a.question.toString() === params.results.answer.question)
        if (index !== -1) {
          results.statistics[index] = { ...params.results.answer }
        } else {
          results.statistics.push({ ...params.results.answer })
        }
      }

      //@INFO: Revisando si viene una entrega
      if (params.results.deliverable) {
        results.deliverable = params.results.deliverable
      }

      // @INFO: Revisar si se envía la tarea
      if(params.results.deliverable_date){
        results.deliverable_date = params.results.deliverable_date
      }

      //@INFO: Revisando si viene una calificación
      if (params.results && params.results.qualification && params.results.qualification.score) {
        results.qualification.score = params.results.qualification.score
        results.qualification.status = 'qualified'
        results.qualification.date = moment.utc().toISOString()
      }

      // @INFO: Calificando el intento
      if (params.qualify === true) {

        // // @INFO: Generar instancia de servicio que representa el tipo de recurso a evaluar
        // const service = await academicResourceQualificationService.getInstance({
        //   type: 'by_resource',
        //   resource: academic_resource_config.academic_resource
        // })

        // if (!service) return responseUtility.buildResponseFailed('json', null, { error_key: 'academicResource.category_invalid' })

        // // @INFO: Evaluando segun el tipo de recurso (ejercicio)
        // const evaluateResponse: any = await service.evaluate({
        //   user: user_exists.user._id,
        //   academic_resource: academic_resource_config.academic_resource._id,
        //   academic_resource_config: academic_resource_config,
        //   results: results
        // })

        // if (evaluateResponse.status === 'error') return evaluateResponse

        // results = evaluateResponse.results
        // newStatistics = (evaluateResponse.newStatistics) ? evaluateResponse.newStatistics : null
      }

      const attemptResponse = await AcademicResourceAttempt.findOneAndUpdate(
        { _id: attempt._id },
        { 'results': results },
        { upsert: true, new: true, useFindAndModify: false }
      )

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          attempt: {
            structure: attemptResponse.structure,
            user: attemptResponse.user,
            results: attemptResponse.results,
            newStatistics: newStatistics,
            _id: attemptResponse._id
          }
        }
      })
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * @INFO Habilitar la edición de un attempt
   */
  public enableAttempt = async (params: IEnableAcademicResourceAttempt) => {
    try{
      // @INFO Validar attempt
      const attempt = await AcademicResourceAttempt
      .findOneAndUpdate(
        {_id: params.id},
        {enable: params.state }
      )
      if(!attempt){
        return responseUtility.buildResponseFailed('json')
      }else{
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            attempt: attempt
          }
        })
      }

    }catch(e){
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const academicResourceAttemptService = new AcademicResourceAttemptService();
export { AcademicResourceAttemptService as DefaultEventsActivityAcademicResourceAcademicResourceAttemptService };
