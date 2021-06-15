// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
import {calendarEventsService} from '@scnode_app/services/default/moodle/calendarEvents/calendarEventsService'
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
// @end

// @import_types Import types
// @end

class CalendarEventsController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}
  /**
   * Metodo que permite consultar los eventos
   * @param req Objeto de clase Express
   * @param res Objeto de clase Express
   * @returns
   */
   public calendarEvents = async (req: Request, res: Response) => {
    let params = req.getParameters.all()
    const response = await calendarEventsService.fetchEvents(params)
    return responseUtility.sendResponseFromObject(res,response);
  }
}

export const calendarEventsController = new CalendarEventsController();
export { CalendarEventsController as DefaultDataCalendarEventsCalendarEventsController };
