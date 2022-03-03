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
import { IMoodleCourse, IMoodleCourseQuery, IMoodleCourseModuleQuery } from '@scnode_app/types/default/moodle/course/moodleCourseTypes'
import { modularMiddleware } from 'app/middlewares/admin/modular/modularMiddleware';
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

    console.log("Fetch Course sections for " + params.courseID);

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

  public moduleList = async (params: IMoodleCourseModuleQuery = {}) => {

    let responseCourseModules = [];
    let singleModuleCourseContent = {
      id: 0,
      sectionid: 0,
      sectionname: '',
      instance: 0,
      modname: '',
      isauditorquiz: false,
      name: '',
      visible: '',
      uservisible: ''
    }

    // Params for Moodle, fetch the complete list. Filtering only from results.
    let moodleParams = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.courses.getContent,
      moodlewsrestformat: moodle_setup.restformat,
      "courseid": params.courseID
    };

    let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
    if (respMoodle.exception) {
      console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: {
            key: 'moodle_course.not_found',
            params: { respMoodle }
          }
        });
    }

    for await (const section of respMoodle) {
      if (section != 0) {

        for await (const module of section.modules) {

          const moduleSearch = params.moduleType.find(field => field == module.modname);
          if (moduleSearch) {
            // console.log('--------------------');
            // console.dir(module, { depth: null, colors: true });
            // console.log('--------------------');

            console.log(': ' + module.id);
            let moodleModuleParams = {
              wstoken: moodle_setup.wstoken,
              wsfunction: moodle_setup.services.courses.getModules,
              moodlewsrestformat: moodle_setup.restformat,
              "cmid": module.id.toString()
            };
            let respMoodleModules = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleModuleParams });
            console.log('Response from modules:');
            console.dir(respMoodleModules.cm.idnumber, { depth: null, colors: true });

            singleModuleCourseContent = {
              id: module.id,
              sectionid: section.id,
              sectionname: section.name,
              name: module.name,
              modname: module.modname,
              isauditorquiz: (respMoodleModules.cm.idnumber) ? ((respMoodleModules.cm.idnumber.trim() == 'auditor') ? true : false) : false,
              instance: module.instance,
              visible: module.visible,
              uservisible: module.uservisible
            };
            responseCourseModules.push(singleModuleCourseContent);
          }

        }
      }
    }
    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        courseModules: responseCourseModules
      }
    })

  }
}

export const courseContentService = new CourseContentService();
export { CourseContentService as DefaultMoodleCourseCourseContentService };
