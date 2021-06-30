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
import { IMoodleCourse, IMoodleCourseQuery } from '@scnode_app/types/default/moodle/course/moodleCourseTypes'
// @end

class CourseContentService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public list = async (params: IMoodleCourseQuery = {}) => {

    let responseCourseContents = [];
    let singleCourseContent = {
      id: 0,
      name: "",
      description: ""
    }

    console.log("FEtch Course sections for " + params.courseID);

    // Params for Moodle, fetch the complete list. Filtering only from results.
    let moodleParams = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.courses.getContent,
      moodlewsrestformat: moodle_setup.restformat,
      "courseid": params.courseID
    };

    console.log("--------------- Fetch contents for CourseID " + params.courseID + ": ---------------------------");

    let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
    if (respMoodle.exception) {
      // ERROR al consultar las categorías de curso en Moodle
      console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
    }
    else {
      console.log(respMoodle);

      respMoodle.forEach(element => {

        if (element.section != 0) {

          singleCourseContent = {
            id: element.id,
            name: element.name,
            description: element.summary
          }
          responseCourseContents.push(singleCourseContent);
        }
      })

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          courseContents: responseCourseContents, //respMoodle.events,
        }
      })
    }

  }

}

export const courseContentService = new CourseContentService();
export { CourseContentService as DefaultMoodleCourseCourseContentService };
