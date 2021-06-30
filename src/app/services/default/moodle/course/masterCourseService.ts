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
import { Course } from '@scnode_app/models'
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IMoodleCourse, IMoodleCourseQuery } from '@scnode_app/types/default/moodle/course/moodleCourseTypes'
import { generalUtility } from 'core/utilities/generalUtility';
// @end

class MasterCourseService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public list = async (params: IMoodleCourseQuery = {}) => {

    let responseCourses = [];
    let singleCourse = {
      id: 0,
      courseCode: "",
      name: "",
      fullname: "",
      displayname: "",
      categoryid: 0,
      description: ""
    }

    // Params for Moodle, fetch the complete list. Filtering only from results.
    let moodleParams = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.courses.get,
      moodlewsrestformat: moodle_setup.restformat,
    };

    console.log("--------------- Fetch courses in Moodle : ---------------------------");

    let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
    if (respMoodle.exception) {
      // ERROR al consultar los cursos en Moodle
      console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
    }
    else {
      console.log("Response: ");
      // Filter if the course belongs to categoryID
      let courses = respMoodle.filter(course => course.categoryid === params.categoryId);

      courses.forEach(courseDetail => {

        // compose the final response object
        singleCourse = {
          id: courseDetail.id,
          courseCode: courseDetail.idnumber,
          name: courseDetail.shortname,
          fullname: courseDetail.fullname,
          displayname: courseDetail.displayname,
          categoryid: courseDetail.categoryid,
          description: courseDetail.summary
        }
        responseCourses.push(singleCourse);

      })
      // masterCategoriesIDs.forEach(catId => {
      // });

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          courses: responseCourses, //respMoodle.events,
        }
      })
    }

  }
}

export const masterCourseService = new MasterCourseService();
export { MasterCourseService as DefaultMoodleCourseMasterCourseService };
