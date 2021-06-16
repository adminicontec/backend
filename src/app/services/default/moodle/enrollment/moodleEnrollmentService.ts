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
import { IMoodleEnrollment } from '@scnode_app/types/default/moodle/enrollment/moodleEnrollmentTypes'
import { generalUtility } from 'core/utilities/generalUtility';
import { Z_PARTIAL_FLUSH } from 'zlib';

// @end

class MoodleEnrollmentService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public insert = async (params: IMoodleEnrollment) => {

    // 4. Creación de matrícula en Moodle (enrollment)
    let moodleParams = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.enrollment.create,
      moodlewsrestformat: moodle_setup.restformat,
      'enrolments[0][roleid]': params.roleid,
      'enrolments[0][courseid]': params.courseid,
      'enrolments[0][userid]': params.userid
    };

    console.log("Enrollment: ROLE = " + params.roleid + " - COURSE = " + params.courseid + " - USERID = " + params.userid);

    let respMoodle = await queryUtility.query({ method: 'post', url: '', api: 'moodle', params: moodleParams });
    if (respMoodle != null) {
      // ERROR al crear la matrícula en MOODLE
      console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
      // return
    }
    else {
      // La matrícula fue creada con éxito
      console.log("Moodle create ENROLLMENT OK: ");
      console.log("Moodle UserID: " + params.userid);
      console.log("Moodle CourseID: " + params.courseid);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          enrollment: {
            userId: params.userid,
            courseId: params.courseid,
          }
        }
      });

    }
  }

  public fetchEnrolledCoursesByUser = async (params: IMoodleEnrollment) => {
    let responseCourses = [];
    let singleCourse = {
      _id: '',
      name: ''
    }
    let singleHistoryCourse = {
      _id: '',
      name: ''
    }


    let moodleParams = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.enrollment.enrolledCourses,
      moodlewsrestformat: moodle_setup.restformat,
      'userid': params.userid
    };
    console.log("Enrolled courses for: userID = " + params.userid + " [" + moodleParams.wsfunction + "]");

    let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
    if (respMoodle) {
      // List of Current courses

      respMoodle.forEach(element => {
        singleCourse = {
          _id: element.id,
          name: element.shortname
        };
        responseCourses.push(singleCourse);
        });

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          current_courses: responseCourses,
          history_courses: []
        }
      });
    }
    else {
      // ERROR al crear la matrícula en MOODLE
      console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
      // return

    }
  }

}

export const moodleEnrollmentService = new MoodleEnrollmentService();
export { MoodleEnrollmentService as DefaultMoodleEnrollmentMoodleEnrollmentService };
