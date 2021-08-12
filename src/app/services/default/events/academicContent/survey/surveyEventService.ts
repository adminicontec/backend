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
import { CourseSchedulingDetails, Enrollment, Survey } from '@scnode_app/models';
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

      let surveyAvailable = false
      // TODO: Consultar la programación
      // En virtual va dirigido al programa y en online y presencial a cada curso
      const schedulingMode = enrollment.course_scheduling.schedulingMode.name
      console.log('schedulingMode', schedulingMode)
      if (schedulingMode === 'Presencial' || schedulingMode === 'En linea') {
        // TODO: Fechas de los cursos
        const detailScheduling = await CourseSchedulingDetails.find({
          course_scheduling: enrollment.course_scheduling._id,
          endDate: {$lt: today}
        }).select('id startDate endDate')
        .lean()
        .sort({startDate: 1})

        console.log('detailScheduling', detailScheduling)

        if (detailScheduling.length === 0) return responseUtility.buildResponseFailed('json') // TODO: Pendiente validacion

        surveyAvailable = true
      } else if (schedulingMode === 'Virtual') {
        // TODO: Fechas del programa
        const endDate = moment.utc(enrollment.course_scheduling.endDate)
        console.log('endDate', endDate)
        if (today.isSameOrBefore(endDate)) {
          surveyAvailable = true
        } else {
          console.log('entro a virtual false')
          return responseUtility.buildResponseFailed('json') // TODO: Pendiente validacion
        }
      }

      console.log('surveyAvailable', surveyAvailable)

      if (surveyAvailable === false) return responseUtility.buildResponseFailed('json') // TODO: Pendiente validacion

      // TODO: Verificar si ya se ejecuto la encuesta

      // console.log('schedulingMode', schedulingMode)

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
        academic_resource_config: data[0].academic_resource_config,
      }})
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const surveyEventService = new SurveyEventService();
export { SurveyEventService as DefaultEventsAcademicContentSurveySurveyEventService };
