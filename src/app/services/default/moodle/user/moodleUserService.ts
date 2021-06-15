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
import { IMoodleUser, IMoodleUserQuery } from '@scnode_app/types/default/moodle/user/moodleUserTypes'
import { generalUtility } from 'core/utilities/generalUtility';
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

      console.log("MoodleUserService() => Field: " + field + " - Value: " + value);
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

    let moodleParams = {
      wstoken: moodle_setup.wstoken,
      wsfunction: moodle_setup.services.users.create,
      moodlewsrestformat: moodle_setup.restformat,
      'users[0][email]': params.email,
      'users[0][username]': params.email,
      'users[0][password]': params.password,
      'users[0][firstname]': params.firstname,
      'users[0][lastname]': params.lastname,
      'users[0][customfields][0][type]': 'regional',
      'users[0][customfields][0][value]': params.regional,
      'users[0][customfields][1][type]': 'fecha_nacimiento',
      'users[0][customfields][1][value]': params.fechaNacimiento,
      'users[0][customfields][2][type]': 'email_2',
      'users[0][customfields][2][value]': params.email2,
      'users[0][customfields][3][type]': 'cargo',
      'users[0][customfields][3][value]': params.cargo,
      'users[0][customfields][4][type]': 'profesion',
      'users[0][customfields][4][value]': params.profesion,
      'users[0][customfields][5][type]': 'nivel_educativo',
      'users[0][customfields][5][value]': params.nivelEducativo,
      'users[0][customfields][6][type]': 'Maestría',
      'users[0][customfields][6][value]': params.nivelEducativo,
      'users[0][customfields][7][type]': 'origen',
      'users[0][customfields][7][value]': params.origen,
      'users[0][customfields][8][type]': 'genero',
      'users[0][customfields][8][value]': params.genero,
    };
    let respMoodle = await queryUtility.query({ method: 'post', url: '', api: 'moodle', params: moodleParams });
    if (respMoodle.exception) {
      // ERROR al crear el usuario en Moodle
      console.log("Moodle: ERROR." + JSON.stringify(respMoodle));
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
