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

class MasterCategoryService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public list = async (params: IMoodleCourseQuery = {}) => {

    try {
      let responseCategories = [];
      let singleCategory = {
        id: 0,
        name: "",
        description: ""
      }

      // Params for Moodle, fetch the complete list. Filtering only from results.
      let moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.courses.getCategory,
        moodlewsrestformat: moodle_setup.restformat,
        "criteria[0][key]": "idnumber",
        "criteria[0][value]": "master",
      };


      console.log("--------------- Fetch categories in Moodle : ---------------------------");

      let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
      console.log('respMoodle', respMoodle);
      if (respMoodle.exception) {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: { key: 'moodle.exception', params: { error: respMoodle.message } }
          }
        )
      }

      if (respMoodle.status === 'error') {
        // ERROR al consultar las categorías de curso en Moodle
        console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: { key: 'moodle.error', params: { error: respMoodle.message } }
          }
        )
      }

      //console.log(respMoodle);

      let masterCategory = respMoodle.filter(m => m.idnumber === "master")

      if (masterCategory != null) {
        let childCategory = respMoodle.filter(c => c.parent === masterCategory[0].id);

        console.log(masterCategory);
        console.log("Filter by parent category: " + masterCategory[0].id);
        console.log(childCategory);

        childCategory.forEach(element => {
          singleCategory = {
            id: element.id,
            name: element.name,
            description: element.description,
          }
          responseCategories.push(singleCategory);
        })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            categories: responseCategories, //respMoodle.events,
          }
        })

      }
      else {
        console.log('else')
        // error if there's no master Category and its children
      }

    } catch (e) {
      console.log('err', e)
      return responseUtility.buildResponseFailed('json')
    }


  }

  public regionals = async (params: IMoodleCourseQuery = {}) => {

    console.log('regionals');
    try {
      let responseCategories = [];
      let singleCategory = {
        id: 0,
        name: "",
        description: ""
      }

      // Params for Moodle, fetch the complete list. Filtering only from results.
      let moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.courses.getCategory,
        moodlewsrestformat: moodle_setup.restformat
        // "criteria[0][key]": "idnumber",
        // "criteria[0][value]": "master",
      };


      console.log("--------------- Fetch categories in Moodle : ---------------------------");

      let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
      //console.log('respMoodle', respMoodle);
      if (respMoodle.exception) {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: { key: 'moodle.exception', params: { error: respMoodle.message } }
          }
        )
      }

      if (respMoodle.status === 'error') {
        // ERROR al consultar las categorías de curso en Moodle
        console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: { key: 'moodle.error', params: { error: respMoodle.message } }
          }
        )
      }

      //console.log(respMoodle);

      let masterCategory = respMoodle; //.filter(m => m.idnumber === "master")

      const regex = new RegExp('/([R0-9])\\d');
      if (respMoodle != null) {
        let childCategory = respMoodle.filter(c => c.idnumber.match(regex));
        console.log(childCategory);

       /* childCategory.forEach(element => {
          singleCategory = {
            id: element.id,
            name: element.name,
            description: element.description,
          }
          responseCategories.push(singleCategory);
        })*/

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            categories: responseCategories, //respMoodle.events,
          }
        })

      }
      else {
        console.log('else')
        // error if there's no master Category and its children
      }

    } catch (e) {
      console.log('err', e)
      return responseUtility.buildResponseFailed('json')
    }


  }

}


export const masterCategoryService = new MasterCategoryService();
export { MasterCategoryService as DefaultMoodleCourseMasterCategoryService };
