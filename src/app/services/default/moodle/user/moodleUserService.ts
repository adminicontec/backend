// @import_dependencies_node Import libraries
// @end

// @import services
import { countryService } from '@scnode_app/services/default/admin/country/countryService'
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
import { IMoodleUser, IMoodleUserQuery } from '@scnode_app/types/default/moodle/user/moodleUserTypes'
import { generalUtility } from '@scnode_core/utilities/generalUtility';
// @end

class MoodleUserService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public findBy = async (params: IMoodleUserQuery) => {
    try {
      //#region  [ 1. Consultar por ShortName de curso para enrolamiento ]
      var field;
      var value;
      // take any of params as Moodle query filter
      if (params.id) {
        field = 'id';
        value = params.id;
      }
      if (params.email) {
        field = 'email';
        value = params.email;
      }
      if (params.username) {
        field = 'username';
        value = params.username;
      }

      console.log("MoodleUserService.findBy() => Field: " + field + " - Value: " + value);
      // 2. Validación si Existe Usuario en Moodle
      let moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.users.findByField,
        moodlewsrestformat: moodle_setup.restformat,
        field: field,
        'values[0]': value
      };

      let respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
      if (respMoodle.exception) {
        console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
      }
      else if (respMoodle.length == 0) {
        console.log("Moodle: No hay usuario");
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            user: null
          }
        })
      }
      else {
        // id de curso en Moodle
        // console.log("[    Moodle resp   ]");
        // console.log(respMoodleDataCourse.courses[0]);

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            user: {
              id: respMoodle[0].id,
              username: respMoodle[0].username,
              firstname: respMoodle[0].firstname,
              lastname: respMoodle[0].lastname,
              fullname: respMoodle[0].fullname,
              email: respMoodle[0].email,

              firstaccess: respMoodle[0].firstaccess,
              lastaccess: respMoodle[0].lastaccess,
              auth: respMoodle[0].auth,
              suspended: respMoodle[0].suspended,
              confirmed: respMoodle[0].confirmed,
              lang: respMoodle[0].lang,
              theme: respMoodle[0].theme,
              timezone: respMoodle[0].timezone,
              city: respMoodle[0].city,
              country: respMoodle[0].country,
              profileimageurlsmall: respMoodle[0].profileimageurlsmall,
              profileimageurl: respMoodle[0].profileimageurl

            }
          }
        })
      }

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public insertOrUpdate = async (params: IMoodleUser) => {
    const customFieldNamesArray = ["regional", "fecha_nacimiento", "email_2", "cargo", "profesion", "nivel_educativo", "empresa", "origen", "genero"];
    var posArray = 0;
    const prefix = 'users[0][customfields][';
    const sufixType = '][type]';
    const sufixValue = '][value]';

    var jsonPropertyName = 'users[0][customfields][0][type]';
    var customFieldType = '';

    var jsonPropertyValue = 'users[0][customfields][0][value]';
    var customFieldValue = '';

    //#region Process Country; send ISO-2
    /*var countryCode = "";
    if (params.country) {
      var country = params.country;
      const response: any = await countryService.findBy({ query: QueryValues.ONE, where: [{ field: 'name', value: country }] })
      if (response.status === 'success') {
        countryCode = response.country.iso2;
        console.log("==> " + countryCode);
      }
      else {
        countryCode = "CO";  // by default
        console.log("==> " + "NO country");
      }
    }*/
    //#endregion

    let moodleParams = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.users.create,
      moodlewsrestformat: moodle_setup.restformat,
      'users[0][email]': params.email,
      'users[0][username]': params.username,
      'users[0][password]': params.password,
      'users[0][firstname]': params.firstname,
      'users[0][lastname]': params.lastname,
      'users[0][idnumber]': params.documentNumber,
      'users[0][city]': params.city,
      'users[0][country]': params.country,
      'users[0][phone1]': params.phonenumber,
    };

    for (let p in params) {

      var cf = customFieldNamesArray.find(field => field == p);
      if (cf != null && params[p] != null) {
        jsonPropertyName = prefix + posArray + sufixType;
        customFieldType = p;

        jsonPropertyValue = prefix + posArray + sufixValue;

        if (cf == 'fechaNacimiento') {
          customFieldValue = generalUtility.unixTime(params[p]).toString();
        }
        else
          customFieldValue = params[p];

        moodleParams[jsonPropertyName] = customFieldType;
        moodleParams[jsonPropertyValue] = customFieldValue;
        posArray++;
      }
    }


    console.log("--------------- Create user in Moodle with: ---------------------------");
    console.log(moodleParams);

    let respMoodle = await queryUtility.query({ method: 'post', url: '', api: 'moodle', params: moodleParams });
    if (respMoodle.exception) {
      // ERROR al crear el usuario en Moodle
      console.log("Moodle: ERROR." + JSON.stringify(respMoodle));

      //return responseUtility.buildResponseFailed('json', null, { error_key: 'user.not_found' })

      // return
    }
    else {
      // Usuario en moodle CREADO con éxito
      console.log("Moodle create USER OK: ");
      console.log("Moodle UserID: " + respMoodle[0].id);
      console.log("Moodle UserName: " + respMoodle[0].username);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          user: {
            id: respMoodle[0].id,
            username: respMoodle[0].username,
          }
        }
      });

    }
  }
}

export const moodleUserService = new MoodleUserService();
export { MoodleUserService as DefaultMoodleUserMoodleUserService };
