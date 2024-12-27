// @import_dependencies_node Import libraries
import { Request, Response } from 'express';
// @end

// @import_models Import models
// @end

// @import_services Import services
// @end

// @import_utilities Import utilities
import { responseUtility } from "@scnode_core/utilities/responseUtility";
import { transactionService } from '@scnode_app/services/default/admin/transaction/transactionService';
import { QueryValues } from '@scnode_app/types/default/global/queryTypes';
// @end

// @import_types Import types
// @end

class TransactionController {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = (req: Request, res: Response) => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public onTransactionSuccess = async (req: Request, res: Response) => {
    const params = req.getParameters.all()
    const signature = req.headers.signature
    const bodyBuffer = req.body
    const response = await transactionService.onTransactionSuccess(params, signature as string, bodyBuffer)
    return responseUtility.sendResponseFromObject(res, response)
  }

  public get = async (req: Request, res: Response) => {
    const {id} = req.getParameters.all()
		const response = await transactionService.findBy({query: QueryValues.ONE, where: [{field: '_id', value: id}]})
		return responseUtility.sendResponseFromObject(res, response)
	}

}

export const transactionController = new TransactionController();
export { TransactionController as DefaultAdminTransactionTransactionController };
