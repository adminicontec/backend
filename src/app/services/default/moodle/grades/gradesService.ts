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
import { IMoodleGradesQuery, ISingleGrade } from '@scnode_app/types/default/moodle/grades/gradesTypes'
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
  public fetchGradesByFilter = async (params: IMoodleGradesQuery) => {
    try {
      //var select = ['assign', 'quiz', 'forum'];
      var select = params.filter;
      let userGradesData = [];

      let courseID;
      let userID

      // take any of params as Moodle query filter
      if (params.courseID && params.userID) {
        courseID = params.courseID;
        userID = params.userID;
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

      for (const usergrade of respMoodleEvents.usergrades) {
        let itemType = {};
        select.forEach(f => {
          itemType[f] = [];
        })

        let userData = {
          userid: usergrade.userid,
          userfullname: usergrade.userfullname
        }
        let singleGrade: ISingleGrade; /* = {
          id: 0,
          idnumber: null, // here contents the "auditor" condition for quiz
          name: '',
          itemtype: '',
          itemmodule: '',
          iteminstance: 0,
          cmid: 0,
          graderaw: 0,
          grademin: 0,
          grademax: 0,
        }*/
        // console.log('+++++++++++++++++++++++++++++++++');
        // console.log(usergrade);

        usergrade.gradeitems.forEach(element => {
          const gradeSearch = select.find(field => field == element.itemmodule);
          if (gradeSearch) {
            singleGrade = {
              id: element.id,
              name: element.itemname,
              idnumber: element.idnumber,
              itemtype: element.itemtype,
              itemmodule: element.itemmodule,
              iteminstance: element.iteminstance,
              cmid: element.cmid ? element.cmid : 0,
              graderaw: element.graderaw ? element.graderaw : 0,
              grademin: element.grademin,
              grademax: element.grademax
            };
            // console.log("usergrade ----------------");
            // console.log(singleGrade);
            itemType[element.itemmodule].push(singleGrade);
          }
          // it applies only for finalGrade on Course
          const gradeSearchInType = select.find(field => field == element.itemtype);
          if (gradeSearchInType) {
            singleGrade = {
              id: element.id,
              name: element.itemname,
              idnumber: element.idnumber,
              itemtype: element.itemtype,
              itemmodule: element.itemtype,
              iteminstance: element.iteminstance,
              cmid: element.cmid ? element.cmid : 0,
              graderaw: element.graderaw ? element.graderaw : 0,
              grademin: element.grademin,
              grademax: element.grademax
            };
            // console.log("usergrade ----------------");
            // console.log(singleGrade);
            itemType[element.itemtype].push(singleGrade);
          }
        });
        userGradesData.push(
          { userData, itemType }
        );
      }

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          grades: userGradesData
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

}

export const gradesService = new GradesService();
export { GradesService as DefaultMoodleGradesGradesService };
