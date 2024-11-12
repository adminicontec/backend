// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { requestUtility } from "@scnode_core/utilities/requestUtility";
import { contactService } from '@scnode_app/services/default/data/contact/contactService';
// @end

// @import_types Import types
// @end

class ContactController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public sendEmail = async (req: Request, res: Response) => {
    const response = await contactService.sendEmail(req.getParameters.all())
    return responseUtility.sendResponseFromObject(res, response)
  }


}

export const contactController = new ContactController();
export { ContactController as DefaultDataContactContactController };
