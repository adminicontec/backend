// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
// @end

// @import_models Import models
import { ConsolidatedSurveyInformation, CourseScheduling, CourseSchedulingDetails, CourseSchedulingMode, CourseSchedulingStatus } from "@scnode_app/models";
// @end

// @import_services
import { surveyDataService } from "@scnode_app/services/default/data/academicContent/survey/surveyDataService";
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
// @end

class SurveyConsolidateDataProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    await surveyDataService.consolidateSurvey({
      output_format: 'db'
    })

    // @INFO: Calcular el porcentaje de satisfacción por programación

    const courseSchedulingStatus = await CourseSchedulingStatus.find().select('id name')
    const courseSchedulingStatusInfo = courseSchedulingStatus.reduce((accum, element) => {
      if (!accum[element.name]) {
        accum[element.name] = element;
      }
      return accum
    }, {})

    if (Object.keys(courseSchedulingStatusInfo).length > 0) {
      let where: any = {
        schedulingStatus: {$in: [
          courseSchedulingStatusInfo['Confirmado']._id,
          courseSchedulingStatusInfo['Ejecutado']._id,
          courseSchedulingStatusInfo['Cancelado']._id,
        ]}
      }

      const courseSchedulings = await CourseScheduling.find(where)
      .select('id schedulingMode')
      .populate({path: 'schedulingMode', select: 'id name'})
      .lean()

      const courseSchedulingIds = courseSchedulings.reduce((accum, element) => {
        accum.push(element._id.toString())
        return accum
      }, [])

      let courseSchedulingDetails = undefined;
      let consolidatedByScheduling = undefined;

      if (courseSchedulingIds.length > 0) {
        const details = await CourseSchedulingDetails.find({
          course_scheduling: {$in: courseSchedulingIds}
        })
        .select('id course_scheduling')
        .lean();

        courseSchedulingDetails = {};
        courseSchedulingDetails = details.reduce((accum, element) => {
          if (element?.course_scheduling) {
            if (!accum[element.course_scheduling.toString()]) {
              accum[element.course_scheduling.toString()] = []
            }
            accum[element.course_scheduling.toString()].push(element)
          }
          return accum
        }, {})


        const consolidated = await ConsolidatedSurveyInformation.find({
          courseScheduling: {$in: courseSchedulingIds}
        })
        .lean();

        consolidatedByScheduling = {};
        consolidatedByScheduling = consolidated.reduce((accum, element) => {
          if (element?.courseScheduling) {
            if (!accum[element.courseScheduling.toString()]) {
              accum[element.courseScheduling.toString()] = []
            }
            accum[element.courseScheduling.toString()].push(element)
          }
          return accum
        }, {})
      }

      for (const courseScheduling of courseSchedulings) {
        if (['Presencial - En linea', 'Presencial', 'En linea', 'En Línea'].includes(courseScheduling.schedulingMode.name)) {
          if (courseSchedulingDetails && courseSchedulingDetails[courseScheduling._id.toString()]) {
            if (consolidatedByScheduling && consolidatedByScheduling[courseScheduling._id.toString()]) {
              const percentageList = []
              for (const consolidate of consolidatedByScheduling[courseScheduling._id.toString()]) {
                if (consolidate?.surveyPercentage) {
                  percentageList.push(consolidate?.surveyPercentage)
                }
              }
              const percentage = Math.round(
                (
                  percentageList.reduce((accum,element) => {
                    return accum += element
                  }, 0) / consolidatedByScheduling[courseScheduling._id.toString()].length
                ) * 100
                ) / 100

              await CourseScheduling.findByIdAndUpdate(courseScheduling._id, { satisfactionSurvey: percentage }, {
                useFindAndModify: false,
                new: true,
                lean: true,
              })
            }
          }
        } else if (courseScheduling.schedulingMode.name === 'Virtual') {
          if (consolidatedByScheduling && consolidatedByScheduling[courseScheduling._id.toString()] && consolidatedByScheduling[courseScheduling._id.toString()][0] && consolidatedByScheduling[courseScheduling._id.toString()][0].surveyPercentage) {
            await CourseScheduling.findByIdAndUpdate(courseScheduling._id, { satisfactionSurvey: consolidatedByScheduling[courseScheduling._id.toString()][0].surveyPercentage }, {
              useFindAndModify: false,
              new: true,
              lean: true,
            })
          }
        }
      }
    }
    return true; // Always return true | false
  }

  // @add_more_methods
  // @end
}

export const surveyConsolidateDataProgram = new SurveyConsolidateDataProgram();
export { SurveyConsolidateDataProgram };
