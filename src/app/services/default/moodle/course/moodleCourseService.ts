// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { moodle_setup } from '@scnode_core/config/globals';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import models
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IMoodleCourse } from '@scnode_app/types/default/moodle/course/moodleCourseTypes'
import { generalUtility } from 'core/utilities/generalUtility';
// @end

class MoodleCourseService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public findBy = async (params: IMoodleCourse) => {
    try {
      //#region  [ 1. Consultar por ShortName de curso para enrolamiento ]
      var field;
      var value;
      // take any of params as Moodle query filter
      if (params.courseID) {
        field = 'id';
        value = params.courseID;
      }
      if (params.idNumber){
        field = 'idnumber';
        value = params.idNumber;
      }
      if (params.shortName){
        field = 'shortname';
        value = params.shortName;
      }

      console.log("Field: " + field);
      let moodleParamsInfoCourse = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.courses.getByField,
        moodlewsrestformat: moodle_setup.restformat,
        'field': field,
        'value': value      };
      // Consulta a Moodle: [core_course_get_courses_by_field]
      const respMoodleDataCourse = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParamsInfoCourse });

      if (respMoodleDataCourse.courses.length == 0) {
        // ERROR al consultar el curso en Moodle
        console.log("Moodle: ERROR." + JSON.stringify(respMoodleDataCourse));
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'moodle_course.not_found', params: { name: params.courseID } } })
      }
      else {
        // id de curso en Moodle
        // console.log("[    Moodle resp   ]");
        // console.log(respMoodleDataCourse.courses[0]);

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            course: {
              id: respMoodleDataCourse.courses[0].id,
              name: respMoodleDataCourse.courses[0].shortname,
              categoryname: respMoodleDataCourse.courses[0].categoryname,
              summary: respMoodleDataCourse.courses[0].summary,
            }
          }
        });

      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const moodleCourseService = new MoodleCourseService();
export { MoodleCourseService as DefaultMoodleCourseMoodleCourseService };
