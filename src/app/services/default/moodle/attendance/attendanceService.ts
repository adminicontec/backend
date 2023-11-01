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
import { IMoodleAddSession, IMoodleRemoveSession } from '@scnode_app/types/default/moodle/attendance/attendanceTypes';
// @end

class AttendanceService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor() { }

  public addSession = async (params: IMoodleAddSession) => {
    try {
      const moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.attendance.addSession,
        moodlewsrestformat: moodle_setup.restformat,
        "attendanceid": params.attendanceId,
        "sessiontime": params.sessionTime,
        "duration": params.duration
      };

      const respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
      if (respMoodle.exception) {
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: {
              key: 'moodle_attendance.exception',
              params: { respMoodle }
            }
          });
      }
      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        sessionId: respMoodle?.sessionid
      }})
    } catch (err) {
      return responseUtility.buildResponseFailed('json', null, {additional_parameters: {
        error: err
      }})
    }

  }

  public removeSession = async (params: IMoodleRemoveSession) => {
    try {
      const moodleParams = {
        wstoken: moodle_setup.wstoken,
        wsfunction: moodle_setup.services.attendance.removeSession,
        moodlewsrestformat: moodle_setup.restformat,
        "sessionid": params.sessionId,
      };

      const respMoodle = await queryUtility.query({ method: 'get', url: '', api: 'moodle', params: moodleParams });
      if (respMoodle.exception) {
        return responseUtility.buildResponseFailed('json', null,
          {
            error_key: {
              key: 'moodle_attendance.exception',
              params: { error: typeof respMoodle === 'string' ? respMoodle : JSON.stringify(respMoodle) }
            }
          });
      }
      return responseUtility.buildResponseSuccess('json')
    } catch (err) {
      return responseUtility.buildResponseFailed('json', null, {additional_parameters: {
        error: err
      }})
    }

  }
}

export const attendanceService = new AttendanceService();
export { AttendanceService as DefaultMoodleCourseAttendanceService };
