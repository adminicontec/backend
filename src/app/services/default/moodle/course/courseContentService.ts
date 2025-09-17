// @import_dependencies_node Import libraries
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { AUDITOR_EXAM_REGEXP, moodle_setup } from '@scnode_core/config/globals';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
// @end

// @import models
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IMoodleCourse, IMoodleCourseQuery, IMoodleCourseModuleQuery } from '@scnode_app/types/default/moodle/course/moodleCourseTypes'
import { modularMiddleware } from '@scnode_app/middlewares/admin/modular/modularMiddleware';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';
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

    // Params for Moodle, fetch the complete list. Filtering only from results.
    let moodleParams = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.courses.getContent,
      moodlewsrestformat: moodle_setup.restformat,
      "courseid": params.courseID
    };

    let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
    if (respMoodle.exception) {
      // ERROR al consultar las categorías de curso en Moodle
      console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
    }
    else {

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

  /**
   * Module list of course content service
   */
  // public moduleList = async (params: IMoodleCourseModuleQuery = {}) => {

  //   let responseCourseModules = [];
  //   let singleModuleCourseContent = {
  //     id: 0,
  //     sectionid: 0,
  //     sectionname: '',
  //     instance: 0,
  //     modname: '',
  //     isauditorquiz: false,
  //     name: '',
  //     visible: '',
  //     uservisible: '',
  //     completion: 0,
  //     url: undefined
  //   }

  //   // Params for Moodle, fetch the complete list. Filtering only from results.
  //   let moodleParams = {
  //     wstoken: moodle_setup.wstoken,
  //     wsfunction: moodle_setup.services.courses.getContent,
  //     moodlewsrestformat: moodle_setup.restformat,
  //     "courseid": params.courseID
  //   };

  //   let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
  //   if (respMoodle.exception) {
  //     console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
  //     return responseUtility.buildResponseFailed('json', null,
  //       {
  //         error_key: {
  //           key: 'moodle_course.not_found',
  //           params: { respMoodle }
  //         }
  //       });
  //   }

  //   for await (const section of respMoodle) {
  //     if (section != 0) {

  //       for await (const module of section.modules) {

  //         const moduleSearch = params.moduleType.find(field => field == module.modname);
  //         if (moduleSearch) {
  //           // console.log('--------------------');
  //           // console.dir(module, { depth: null, colors: true });
  //           // console.log('--------------------');

  //           //console.log(': ' + module.id);
  //           let moodleModuleParams = {
  //             wstoken: moodle_setup.wstoken,
  //             wsfunction: moodle_setup.services.courses.getModules,
  //             moodlewsrestformat: moodle_setup.restformat,
  //             "cmid": module.id.toString()
  //           };
  //           let respMoodleModules = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleModuleParams });
  //           //console.log('Response from modules:');
  //           //console.dir(respMoodleModules.cm.idnumber, { depth: null, colors: true });

  //           singleModuleCourseContent = {
  //             id: module.id,
  //             sectionid: section.id,
  //             sectionname: section.name,
  //             name: module.name,
  //             modname: module.modname,
  //             isauditorquiz: (respMoodleModules && respMoodleModules.cm && respMoodleModules.cm.idnumber) ? (AUDITOR_EXAM_REGEXP.test(respMoodleModules.cm.idnumber.trim()) ? true : false) : false,
  //             instance: module.instance,
  //             visible: module.visible,
  //             uservisible: module.uservisible,
  //             completion: module.completion,
  //             url: undefined
  //           };
  //           responseCourseModules.push(singleModuleCourseContent);
  //         } else {
  //           const isWebex = this.isWebex(module.name)
  //           if (isWebex && params.moduleType.find(field => field === 'session')) {
  //             singleModuleCourseContent = {
  //               id: module.id,
  //               sectionid: section.id,
  //               sectionname: section.name,
  //               name: module.name,
  //               modname: 'session',
  //               isauditorquiz: false,
  //               instance: module.instance,
  //               visible: module.visible,
  //               uservisible: module.uservisible,
  //               completion: module.completion,
  //               url: module?.url || undefined
  //             };
  //             responseCourseModules.push(singleModuleCourseContent);
  //           }
  //         }
  //       }
  //     }
  //   }
  //   return responseUtility.buildResponseSuccess('json', null, {
  //     additional_parameters: {
  //       courseModules: responseCourseModules
  //     }
  //   })
  // }

  public moduleList = async (params: IMoodleCourseModuleQuery = {}, searchAuditorData: boolean = true) => {
    // Estructura base de respuesta
    const responseCourseModules = [];

    // Params para obtener contenido del curso
    const moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.courses.getContent,
        moodlewsrestformat: moodle_setup.restformat,
        courseid: params.courseID
    };

    // Obtener contenido del curso
    const respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
    if (respMoodle.exception) {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
        return responseUtility.buildResponseFailed('json', null, {
            error_key: {
                key: 'moodle_course.not_found',
                params: { respMoodle }
            }
        });
    }

    // Recolectar todos los IDs de módulos que necesitamos consultar
    const moduleIds = [];
    const moduleMap = new Map();

    // Primera pasada: recolectar IDs y crear estructura inicial
    respMoodle.forEach(section => {
        if (section != 0) {
            section.modules.forEach(module => {
                const moduleSearch = params.moduleType.find(field => field === module.modname);
                if (moduleSearch) {
                    moduleIds.push(module.id);
                    moduleMap.set(module.id, {
                        module,
                        section,
                        type: 'regular'
                    });
                } else if (this.isWebex(module.name) && params.moduleType.find(field => field === 'session')) {
                    // Manejar módulos Webex directamente sin necesidad de consulta adicional
                    responseCourseModules.push({
                        id: module.id,
                        sectionid: section.id,
                        sectionname: section.name,
                        name: module.name,
                        modname: 'session',
                        isauditorquiz: false,
                        instance: module.instance,
                        visible: module.visible,
                        uservisible: module.uservisible,
                        completion: module.completion,
                        url: module?.url || undefined
                    });
                }
            });
        }
    });

    // Realizar una única llamada batch para obtener todos los módulos
    if (moduleIds.length > 0 && searchAuditorData) {
        const batchPromises = moduleIds.map(cmid => {
            const moodleModuleParams = {
                wstoken: moodle_setup.wstoken,
                wsfunction: moodle_setup.services.courses.getModules,
                moodlewsrestformat: moodle_setup.restformat,
                cmid: cmid.toString()
            };
            return queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleModuleParams });
        });

        const moduleResults = await Promise.all(batchPromises);

        // Procesar resultados
        moduleResults.forEach((respMoodleModules, index) => {
            const moduleId = moduleIds[index];
            const moduleInfo = moduleMap.get(moduleId);

            if (moduleInfo) {
                const { module, section } = moduleInfo;
                responseCourseModules.push({
                    id: module.id,
                    sectionid: section.id,
                    sectionname: section.name,
                    name: module.name,
                    modname: module.modname,
                    isauditorquiz: (respMoodleModules?.cm?.idnumber)
                        ? AUDITOR_EXAM_REGEXP.test(respMoodleModules.cm.idnumber.trim())
                        : false,
                    instance: module.instance,
                    visible: module.visible,
                    uservisible: module.uservisible,
                    completion: module.completion,
                    url: undefined
                });
            }
        });
    }

    return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
            courseModules: responseCourseModules
        }
    });
  }

  private isWebex (str: string) {
    return (str.includes('Webex -'))
  }
}

export const courseContentService = new CourseContentService();
export { CourseContentService as DefaultMoodleCourseCourseContentService };
