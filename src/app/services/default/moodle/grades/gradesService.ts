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
import { generalUtility } from '@scnode_core/utilities/generalUtility';
import { IMoodleGradeReportOverviewGetCourseGrades, IMoodleGradesQuery, ISingleGrade } from '@scnode_app/types/default/moodle/grades/gradesTypes'
// @end

class GradesService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public fetchGrades = async (params: IMoodleGradesQuery) => {
    try {

      var select = ['assign', 'quiz', 'forum'];

      let responseGrades = [];
      let singleGrade = {
        id: 0,
        name: '',
        itemtype: '',
        itemmodule: '',
        cmid: 0,
        graderaw: 0,
        grademin: 0,
        grademax: 0,
      }

      let courseID;
      let userID

      // take any of params as Moodle query filter
      if (params.courseID && params.userID) {
        courseID = params.courseID;
        userID = params.userID;
        //console.log("Calificaciones para el curso " + courseID + " y usuario " + userID);
      }
      else {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'grades.exception', params: { name: "courseID o userID" } } });
      }

      let moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.completion.gradeReport,
        moodlewsrestformat: moodle_setup.restformat,
        'courseid': courseID,
        'userid': userID,
      };

      let respMoodleEvents = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });

      if (respMoodleEvents.exception) {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodleEvents));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: 'grades.moodle_exception',
            additional_parameters: {
              process: moodleParams.wsfunction,
              error: respMoodleEvents
            }
          });
      }

      respMoodleEvents.usergrades[0].gradeitems.forEach(element => {
        const gradeSearch = select.find(field => field == element.itemmodule);

        if (gradeSearch != null) {

          singleGrade = {
            id: element.id,
            name: element.itemname,
            itemmodule: element.itemmodule,
            itemtype: element.itemtype,
            cmid: element.cmid,
            graderaw: element.graderaw,
            grademin: element.grademin,
            grademax: element.grademax
          };

          responseGrades.push(singleGrade);
        }
      });

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          grades: responseGrades
        }
      })

    } catch (e) {
      console.log(e.message);
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'grades.exception',
          additional_parameters: {
            process: 'fetchEvents()',
            error: e.message
          }
        });

    }

  }
  /**
   * Obtiene las calificaciones de un curso filtradas por items específicos.
   * @param params
   * @returns
   */
  // public fetchGradesByFilter = async (params: IMoodleGradesQuery) => {
  //   try {

  //     //var select = ['assign', 'quiz', 'forum'];
  //     var select = params.filter;
  //     let userGradesData = [];

  //     let courseID;
  //     let userID

  //     // take any of params as Moodle query filter
  //     if (params.courseID && params.userID) {
  //       courseID = params.courseID;
  //       userID = params.userID;
  //     }
  //     else {
  //       return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'grades.exception', params: { name: "courseID o userID" } } });
  //     }

  //     let moodleParams = {
  //       wstoken: moodle_setup.wstoken,
  //       wsfunction: moodle_setup.services.completion.gradeReport,
  //       moodlewsrestformat: moodle_setup.restformat,
  //       'courseid': courseID,
  //       'userid': userID,
  //     };

  //     let respMoodleEvents = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });

  //     if (respMoodleEvents.exception) {
  //       console.log("Moodle: ERROR." + JSON.stringify(respMoodleEvents));
  //       return responseUtility.buildResponseFailed('json', null,
  //         {
  //           error_key: 'grades.moodle_exception',
  //           additional_parameters: {
  //             process: moodleParams.wsfunction,
  //             error: respMoodleEvents
  //           }
  //         });
  //     }

  //     for (const usergrade of respMoodleEvents.usergrades) {
  //       let itemType = {};
  //       select.forEach(f => {
  //         itemType[f] = [];
  //       })

  //       let userData = {
  //         userid: usergrade.userid,
  //         userfullname: usergrade.userfullname
  //       }
  //       let singleGrade: ISingleGrade; /* = {
  //         id: 0,
  //         idnumber: null, // here contents the "auditor" condition for quiz
  //         name: '',
  //         itemtype: '',
  //         itemmodule: '',
  //         iteminstance: 0,
  //         cmid: 0,
  //         graderaw: 0,
  //         grademin: 0,
  //         grademax: 0,
  //       }*/
  //       // console.log('+++++++++++++++++++++++++++++++++');
  //       // console.log(usergrade);

  //       usergrade.gradeitems.forEach(element => {
  //         const gradeSearch = select.find(field => field == element.itemmodule);
  //         if (gradeSearch) {
  //           singleGrade = {
  //             id: element.id,
  //             name: element.itemname,
  //             idnumber: element.idnumber,
  //             itemtype: element.itemtype,
  //             itemmodule: element.itemmodule,
  //             iteminstance: element.iteminstance,
  //             cmid: element.cmid ? element.cmid : 0,
  //             graderaw: element.graderaw ? element.graderaw : 0,
  //             grademin: element.grademin,
  //             grademax: element.grademax
  //           };
  //           // console.log("usergrade ----------------");
  //           // console.log(singleGrade);
  //           itemType[element.itemmodule].push(singleGrade);
  //         }
  //         // it applies only for finalGrade on Course
  //         const gradeSearchInType = select.find(field => field == element.itemtype);
  //         if (gradeSearchInType) {
  //           singleGrade = {
  //             id: element.id,
  //             name: element.itemname,
  //             idnumber: element.idnumber,
  //             itemtype: element.itemtype,
  //             itemmodule: element.itemtype,
  //             iteminstance: element.iteminstance,
  //             cmid: element.cmid ? element.cmid : 0,
  //             graderaw: element.graderaw ? element.graderaw : 0,
  //             grademin: element.grademin,
  //             grademax: element.grademax
  //           };
  //           // console.log("usergrade ----------------");
  //           // console.log(singleGrade);
  //           itemType[element.itemtype].push(singleGrade);
  //         }
  //       });
  //       userGradesData.push(
  //         { userData, itemType }
  //       );
  //     }

  //     return responseUtility.buildResponseSuccess('json', null, {
  //       additional_parameters: {
  //         grades: userGradesData
  //       }
  //     })

  //   } catch (e) {
  //     console.log(e.message);
  //     return responseUtility.buildResponseFailed('json', null,
  //       {
  //         error_key: 'grades.exception',
  //         additional_parameters: {
  //           process: 'fetchEvents()',
  //           error: e.message
  //         }
  //       });
  //   }
  // }

  public fetchGradesByFilter = async (params: IMoodleGradesQuery) => {
    try {
        console.time('GradesService::fetchGradesByFilter');

        const { courseID, userID, userIDs, filter: select } = params;
        const selectSet = new Set(select);
        let allUserGradesData = [];

        // Si se proporciona un único userID, realizar una sola petición
        if (userID) {
          const moodleParams = {
              wstoken: moodle_setup.wstoken,
              wsfunction: moodle_setup.services.completion.gradeReport,
              moodlewsrestformat: moodle_setup.restformat,
              courseid: courseID,
              userid: userID,
          };

          const respMoodleEvents = await queryUtility.query({
              method: 'get',
              url: '',
              api: 'moodle',
              params: moodleParams
          });

          if (respMoodleEvents.exception) {
              console.error(`Error for user ${userID}:`, JSON.stringify(respMoodleEvents));
              return responseUtility.buildResponseFailed('json', null, {
                  error_key: 'grades.moodle_exception',
                  additional_parameters: {
                      process: moodleParams.wsfunction,
                      error: respMoodleEvents
                  }
              });
          }

          // Manejar el caso cuando userID es '0' o cuando hay múltiples usuarios
          if (userID === '0' || respMoodleEvents.usergrades.length > 1) {
            // Procesar todos los usuarios en el resultado
            allUserGradesData = respMoodleEvents.usergrades
                .map(usergrade => this.processUserGrades(usergrade, select, selectSet))
                .filter(result => result !== null);
          } else {
              // Procesar un único usuario
              const processedGrades = this.processUserGrades(respMoodleEvents.usergrades[0], select, selectSet);
              allUserGradesData = processedGrades ? [processedGrades] : [];
          }
        }
        // Procesar múltiples usuarios en lotes
        else if (userIDs && userIDs.length > 0) {
          const BATCH_SIZE = 20; // Tamaño óptimo del lote

          for (let i = 0; i < userIDs.length; i += BATCH_SIZE) {
              console.time(`Batch ${i/BATCH_SIZE + 1}`);
              const userBatch = userIDs.slice(i, i + BATCH_SIZE);

              // Procesar lote actual en paralelo
              const batchPromises = userBatch.map(async (userID) => {
                  const moodleParams = {
                      wstoken: moodle_setup.wstoken,
                      wsfunction: moodle_setup.services.completion.gradeReport,
                      moodlewsrestformat: moodle_setup.restformat,
                      courseid: courseID,
                      userid: userID,
                  };

                  try {
                      const respMoodleEvents = await queryUtility.query({
                          method: 'get',
                          url: '',
                          api: 'moodle',
                          params: moodleParams
                      });

                      if (respMoodleEvents.exception) {
                          console.error(`Error for user ${userID}:`, JSON.stringify(respMoodleEvents));
                          return null;
                      }

                      return this.processUserGrades(respMoodleEvents.usergrades[0], select, selectSet);
                  } catch (error) {
                      console.error(`Error processing user ${userID}:`, error);
                      return null;
                  }
              });

              // Esperar a que se complete el lote actual
              const batchResults = await Promise.all(batchPromises);

              // Filtrar resultados nulos y agregar al resultado final
              allUserGradesData = allUserGradesData.concat(batchResults.filter(result => result !== null));

              console.timeEnd(`Batch ${i/BATCH_SIZE + 1}`);

              // Pequeña pausa entre lotes para evitar sobrecarga
              if (i + BATCH_SIZE < userIDs.length) {
                  await new Promise(resolve => setTimeout(resolve, 500));
              }
          }
        } else {
          return responseUtility.buildResponseFailed('json', null, {
              error_key: {
                  key: 'grades.exception',
                  params: { name: "Se requiere userID o userIDs" }
              }
          });
        }

        console.timeEnd('GradesService::fetchGradesByFilter');
        return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
                grades: allUserGradesData
            }
        });

    } catch (error) {
        console.error('Error in fetchGradesByFilter:', error);
        return responseUtility.buildResponseFailed('json', null, {
            error_key: 'grades.exception',
            additional_parameters: {
                process: 'fetchGradesByFilter()',
                error: error.message
            }
        });
    }
  }

  // Método auxiliar para procesar las calificaciones de un usuario
  private processUserGrades(usergrade: any, select: string[], selectSet: Set<string>) {
    if (!usergrade) return null;

    // Inicializar estructura de itemType
    const itemType = Object.fromEntries(select.map(f => [f, []]));

    // Procesar items de calificación
    for (const element of usergrade.gradeitems) {
        const { itemmodule, itemtype } = element;

        if (selectSet.has(itemmodule)) {
            itemType[itemmodule].push(this.createGradeObject(element));
        } else if (selectSet.has(itemtype)) {
            itemType[itemtype].push(this.createGradeObject(element, true));
        }
    }

    return {
        userData: {
            userid: usergrade.userid,
            userfullname: usergrade.userfullname
        },
        itemType
    };
  }

  // Método auxiliar para crear objeto de calificación
  private createGradeObject(element: any, useItemType: boolean = false): ISingleGrade {
      return {
          id: element.id,
          name: element.itemname,
          idnumber: element.idnumber,
          itemtype: element.itemtype,
          itemmodule: useItemType ? element.itemtype : element.itemmodule,
          iteminstance: element.iteminstance,
          cmid: element.cmid || 0,
          graderaw: element.graderaw || 0,
          grademin: element.grademin,
          grademax: element.grademax
      };
  }

  public fetchFinalGrades = async (params: IMoodleGradesQuery) => {
    try {

      var select = ['course'];
      //var select = params.filter;

      let responseGrades = [];
      let singleGrade = {
        id: 0,
        name: '',
        itemtype: '',
        itemmodule: '',
        cmid: 0,
        graderaw: 0,
        grademin: 0,
        grademax: 0,
      }

      let courseID;
      let userID

      // take any of params as Moodle query filter
      if (params.courseID && params.userID) {
        courseID = params.courseID;
        userID = params.userID;
        //console.log("Calificaciones para el curso " + courseID + " y usuario " + userID);
      }
      else {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'grades.exception', params: { name: "courseID o userID" } } });
      }

      let moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.completion.gradeReport,
        moodlewsrestformat: moodle_setup.restformat,
        'courseid': courseID,
        'userid': userID,
      };

      let respMoodleEvents = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });

      if (respMoodleEvents.exception) {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodleEvents));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: 'grades.moodle_exception',
            additional_parameters: {
              process: moodleParams.wsfunction,
              error: respMoodleEvents
            }
          });
      }
      // console.log('search by:');
      // console.log(select);

      respMoodleEvents.usergrades[0].gradeitems.forEach(element => {

        const gradeSearch = select.find(field => field == element.itemtype);
        if (gradeSearch) {
          singleGrade = {
            id: element.id,
            name: element.itemname,
            itemtype: element.itemtype,
            itemmodule: element.itemmodule,
            cmid: element.cmid,
            graderaw: element.graderaw,
            grademin: element.grademin,
            grademax: element.grademax
          };

          responseGrades.push(singleGrade);
        }
      });

      // console.log('Response: ');
      // console.log(responseGrades);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          grades: responseGrades
        }
      })

    } catch (e) {
      console.log(e.message);
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'grades.exception',
          additional_parameters: {
            process: 'fetchEvents()',
            error: e.message
          }
        });
    }

  }

  public fetchOverviewGetCourseGrades = async (params: IMoodleGradeReportOverviewGetCourseGrades) => {
    try {
      const {userid, courseid} = params
      // const courseid = 1

      const moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.completion.getGeneralProgress,
        moodlewsrestformat: moodle_setup.restformat,
        'userid': userid,
      };

      const respMoodleEvents = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });

      if (respMoodleEvents.exception) {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodleEvents));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: 'grades.moodle_exception',
            additional_parameters: {
              process: moodleParams.wsfunction,
              error: respMoodleEvents
            }
          });
      }

      const generalProgress = respMoodleEvents?.grades
        .filter((g) => g.courseid === Number(courseid))
        .map((g) => g.rawgrade ?? 0)

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          generalProgress: generalProgress.length > 0 ? Number(generalProgress[0]) : 0
        }
      })

    } catch (e) {
      console.log(e.message);
      return responseUtility.buildResponseFailed('json', null,
        {
          error_key: 'grades.exception',
          additional_parameters: {
            process: 'fetchEvents()',
            error: e.message
          }
        });
    }
  }

}

export const gradesService = new GradesService();
export { GradesService as DefaultMoodleGradesGradesService };
