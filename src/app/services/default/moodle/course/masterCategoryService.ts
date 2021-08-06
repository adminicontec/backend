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
    if (respMoodle.exception) {
      // ERROR al consultar las categorías de curso en Moodle
      console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
    }
    else {
      //console.log(respMoodle);

      let masterCategory = respMoodle.filter(m => m.idnumber === "master")

      if (masterCategory != null) {
        let childCategory = respMoodle.filter(c => c.parent === masterCategory[0].id);

        console.log( masterCategory);
        console.log("Filter by parent category: " + masterCategory[0].id);
        console.log(childCategory);


        childCategory.forEach(element => {
          singleCategory = {
            id: element.id,
            name: element.name,
            description: element.description
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
        // error if there's no master Category and its children
      }
    }

  }

}


export const masterCategoryService = new MasterCategoryService();
export { MasterCategoryService as DefaultMoodleCourseMasterCategoryService };
