// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
import moment from 'moment'
// @end

// @import services
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { surveyLogService } from '@scnode_app/services/default/admin/survey/surveyLogService';
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
      const today = moment()

      // @INFO: Validando el usuario
      const userResponse: any = await userService.findBy({query: QueryValues.ONE, where: [{'field': '_id', 'value': params.user}]})
      if (userResponse.status === 'error') return userResponse

      // @INFO: Validando el programa
      const enrollments = await Enrollment.find({user: params.user})
      .select('id course_scheduling')
      .populate({path: 'course_scheduling', select: 'id program schedulingMode startDate endDate', populate: [
        {
          path: 'schedulingMode', select: 'id name'
        },
        {
          path: 'program', select: 'id name code'
        }
      ]})
      .lean()
      // console.log('enrollment', enrollment)

      if (enrollments.length === 0) return responseUtility.buildResponseFailed('json', null, {error_key: ''})

      // if (!enrollment) return responseUtility.buildResponseFailed('json', null, {error_key: ''})

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

      console.log('today', today)
      let surveyAvailable = false
      let surveyRelated = null
      let surveyRelatedContent = null

      // Para el log de encuestas
      let course_scheduling: string | undefined = undefined;
      let course_scheduling_details: string | undefined = undefined;
      let endDateService: Date | undefined = undefined;

      for (const enrollment of enrollments) {
        if (!surveyAvailable) {
          // En virtual va dirigido al programa y en online y presencial a cada curso
          const schedulingMode = enrollment.course_scheduling.schedulingMode.name
          console.log('schedulingMode', schedulingMode)
          if (['Presencial - En linea', 'Presencial', 'En linea', 'En Línea'].includes(schedulingMode)) {
            // TODO: Fechas de los cursos
            let whereDetailScheduling = {
              course_scheduling: enrollment.course_scheduling._id,
              // endDate: {$lt: today.format('YYYY-MM-DD')}
            }
            if (survey_related.length > 0) {
              whereDetailScheduling['_id'] = {$nin: survey_related}
            }
            const detailScheduling = await CourseSchedulingDetails.find(whereDetailScheduling)
            .select('id course startDate endDate sessions')
            .populate({path: 'course', select: 'id name code'})
            .lean()
            .sort({startDate: 1})

            console.log('detailScheduling', detailScheduling)

            // if (detailScheduling.length === 0) return responseUtility.buildResponseFailed('json') // TODO: Pendiente validacion

            let anySessionExpiredToday = false
            detailScheduling.map((course) => {
              console.log('course',course._id)
              if (!anySessionExpiredToday) {
                if (course.sessions && course.sessions.length > 0) {
                  let sessions = course.sessions.reduce((accum, element) => {
                    if (element.startDate && element.duration) {
                      element.endDate = moment(element.startDate).add(element.duration, 'seconds')
                      accum.push(element)
                    }
                    return accum
                  }, [])
                  sessions.sort((a, b) => moment(a.startDate).diff(moment(b.startDate)))
                  console.log('sessions', sessions)
                  if (sessions.length > 0)  {
                    const lastSession = sessions[sessions.length-1]
                    console.log('lastSession', lastSession)
                    // if (today.format('YYYY-MM-DD ') >= endDate.format('YYYY-MM-DD')) {
                      if (today.isAfter(lastSession.endDate.subtract(30, 'minutes'))) {
                        console.log('session selected', lastSession)
                        anySessionExpiredToday = true
                        surveyAvailable = true
                        surveyRelated = course._id
                        surveyRelatedContent = {
                          name: course.course.name,
                          endDate: lastSession.endDate,
                          mode_id: enrollment.course_scheduling.schedulingMode._id
                        }
                        // Para el log de encuestas
                        course_scheduling = enrollment.course_scheduling._id;
                        course_scheduling_details = course._id;
                        endDateService = lastSession.endDate;
                      }
                  }
                }
              }
            })
          } else if (schedulingMode === 'Virtual') {
            // TODO: Fechas del programa
            const endDate = moment.utc(enrollment.course_scheduling.endDate)
            console.log('endDate', endDate)
            console.log('today', today)
            console.log('compare', today.format('YYYY-MM-DD') <= endDate.format('YYYY-MM-DD'))
            console.log('enrollment.course_scheduling._id', enrollment.course_scheduling._id)
            if (!survey_related.includes(enrollment.course_scheduling._id.toString())) {
              if (today.format('YYYY-MM-DD') >= endDate.format('YYYY-MM-DD')) {
                surveyAvailable = true
                surveyRelated = enrollment.course_scheduling._id
                surveyRelatedContent = {
                  name: enrollment.course_scheduling.program.name,
                  endDate: enrollment.course_scheduling.endDate,
                  mode_id: enrollment.course_scheduling.schedulingMode._id
                }
                // Para el log de encuestas
                course_scheduling = enrollment.course_scheduling._id;
                course_scheduling_details = undefined;
                endDateService = enrollment.course_scheduling.endDate;
              } else {
                console.log('entro a virtual false')
                // return responseUtility.buildResponseFailed('json') // TODO: Pendiente validacion
              }
            }

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
            'config.content.config.course_modes': ObjectID(surveyRelatedContent.mode_id),
            'deleted': false,
            'status': 'enabled'
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

      // @INFO: Agregar un surveyLog
      await surveyLogService.saveLog({
        course_scheduling,
        course_scheduling_details,
        endDate: endDateService
      });

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        survey: data[0].survey,
        surveyRelated,
        surveyRelatedContent,
        academic_resource_config: data[0].academic_resource_config,
      }})
    } catch (error) {
      console.log(error)
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const surveyEventService = new SurveyEventService();
export { SurveyEventService as DefaultEventsAcademicContentSurveySurveyEventService };
