// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
import moment from 'moment'
// @end

// @import services
import { userService } from '@scnode_app/services/default/admin/user/userService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { AcademicResourceAttempt, CourseSchedulingDetails, Enrollment, Survey } from '@scnode_app/models';
// @end

// @import types
import {ICheckSurveyAvailable} from '@scnode_app/types/default/events/academicContent/survey/surveyEventTypes'
import { QueryValues } from '@scnode_app/types/default/global/queryTypes';
// @end

class SurveyEventService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar si una encuesta esta disponible
   * @param params
   * @returns
   */
  public checkSurveyAvailable = async (params: ICheckSurveyAvailable) => {
    try {
      const today = moment.utc()

      // @INFO: Validando el usuario
      const userResponse: any = await userService.findBy({query: QueryValues.ONE, where: [{'field': '_id', 'value': params.user}]})
      if (userResponse.status === 'error') return userResponse

      // @INFO: Validando el programa
      const enrollment = await Enrollment.findOne({user: params.user, courseID: params.moodle_id})
      .select('id course_scheduling')
      .populate({path: 'course_scheduling', select: 'id schedulingMode startDate endDate', populate: {
        path: 'schedulingMode', select: 'id name'
      }})
      .lean()
      console.log('enrollment', enrollment)

      if (!enrollment) return responseUtility.buildResponseFailed('json', null, {error_key: ''})

      const surveyAnswered = await AcademicResourceAttempt.find({
        user: params.user,
        'results.surveyRelated': {$exists: true}
      }).select('id results.surveyRelated')
      .lean()

      const survey_related = surveyAnswered.reduce((accum, element) => {
        accum.push(element.results.surveyRelated.toString())
        return accum
      }, [])

      console.log('survey_related', survey_related)

      let surveyAvailable = false
      let surveyRelated = null
      // TODO: Consultar la programación
      // En virtual va dirigido al programa y en online y presencial a cada curso
      const schedulingMode = enrollment.course_scheduling.schedulingMode.name
      console.log('schedulingMode', schedulingMode)
      if (schedulingMode === 'Presencial' || schedulingMode === 'En linea' || schedulingMode === 'En Línea') {
        // TODO: Fechas de los cursos
        let whereDetailScheduling = {
          course_scheduling: enrollment.course_scheduling._id,
          endDate: {$lt: today}
        }
        if (survey_related.length > 0) {
          whereDetailScheduling['_id'] = {$nin: survey_related}
        }
        const detailScheduling = await CourseSchedulingDetails.find(whereDetailScheduling)
        .select('id startDate endDate')
        .lean()
        .sort({startDate: 1})

        console.log('detailScheduling', detailScheduling)

        if (detailScheduling.length === 0) return responseUtility.buildResponseFailed('json') // TODO: Pendiente validacion

        surveyAvailable = true
        surveyRelated = detailScheduling[0]._id
      } else if (schedulingMode === 'Virtual') {
        // TODO: Fechas del programa
        const endDate = moment.utc(enrollment.course_scheduling.endDate)
        console.log('endDate', endDate)
        console.log('today', today)
        console.log('compare', today.format('YYYY-MM-DD') <= endDate.format('YYYY-MM-DD'))
        console.log('enrollment.course_scheduling._id', enrollment.course_scheduling._id)
        if (!survey_related.includes(enrollment.course_scheduling._id.toString())) {
          if (today.format('YYYY-MM-DD') <= endDate.format('YYYY-MM-DD')) {
            surveyAvailable = true
            surveyRelated = enrollment.course_scheduling._id
          } else {
            console.log('entro a virtual false')
            return responseUtility.buildResponseFailed('json') // TODO: Pendiente validacion
          }
        }

      }

      console.log('surveyAvailable', surveyAvailable)

      if (surveyAvailable === false) return responseUtility.buildResponseFailed('json') // TODO: Pendiente validacion

      const aggregateQuery = [
        {
          $lookup: {
            from: 'academic_resource_configs',
            localField: 'config.content',
            foreignField: '_id',
            as: 'config.content'
          }
        },
        { $unwind: '$config.content' },
        {
          $match: {
            'config.content.config.course_modes': ObjectID(enrollment.course_scheduling.schedulingMode._id),
            'deleted': false
          }
        },
        {
          $group: {
            _id: '$_id',
            survey: { "$first": '$_id'},
            academic_resource_config: {$first: '$config.content._id'}
          }
        }
      ]

      const data = await Survey.aggregate(aggregateQuery)
      console.log('data', data)

      if (data.length === 0) return responseUtility.buildResponseFailed('json') // TODO: Pendiente

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        survey: data[0].survey,
        surveyRelated,
        academic_resource_config: data[0].academic_resource_config,
      }})
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const surveyEventService = new SurveyEventService();
export { SurveyEventService as DefaultEventsAcademicContentSurveySurveyEventService };
