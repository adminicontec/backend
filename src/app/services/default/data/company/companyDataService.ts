// @import_dependencies_node Import libraries
// @end

// @import services
import {companyService} from '@scnode_app/services/default/admin/company/companyService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import {Company, CourseScheduling} from '@scnode_app/models'
// @end

// @import types
import {ICompanyQuery, IFetchCompany, ParamsFetchCompaniesExecutiveByUser} from '@scnode_app/types/default/admin/company/companyTypes'
// @end

class CompanyDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar una compañia
   * @param params Filtros para buscar el elemento
   * @returns
   */
   public fetchCompany = async (params: IFetchCompany) => {

    try {
      let select = 'id slug name description logo background'

      let where = {}

      if (params.id) {
        where['_id'] = params.id
      } else if (params.slug) {
        where['slug'] = params.slug
      } else {
        return responseUtility.buildResponseFailed('json', null, {error_key: 'company.filter_to_search_required'})
      }

      let register = null
      try {
        register =  await Company.findOne(where)
        .select(select)
        .lean()

        if (register && register.logo) {
          register.logo = companyService.logoUrl(register)
        }
        if (register && register.background) {
          register.background = companyService.backgroundUrl(register)
        }
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          company: register
        }})
      } catch (e) {}

      return responseUtility.buildResponseFailed('json')
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite consultar el listado de compañias
   * @param params
   * @returns
   */
   public fetchCompanies = async (params: ICompanyQuery) => {

    const paging = (params.pageNumber && params.nPerPage) ? true : false

    const pageNumber= params.pageNumber ? (parseInt(params.pageNumber)) : 1
    const nPerPage= params.nPerPage ? (parseInt(params.nPerPage)) : 10

    let select = 'id slug name description logo background'
    if (params.select) {
      select = params.select
    }

    let where = {}

    if(params.search){
      const search = params.search
      where = {
        ...where,
        $or:[
          {name: { $regex: '.*' + search + '.*',$options: 'i' }},
          {description: { $regex: '.*' + search + '.*',$options: 'i' }},
        ]
      }
    }

    let registers = []
    try {
      registers =  await Company.find(where)
      .select(select)
      .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
      .limit(paging ? nPerPage : null)
      .sort({created_at: -1})
      .lean()

      for await (const register of registers) {
        if (register.logo) {
          register.logo = companyService.logoUrl(register)
        }
        if (register.background) {
          register.background = companyService.backgroundUrl(register)
        }
      }
    } catch (e) {}

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        companies: [
          ...registers
        ],
        total_register: (paging) ? await Company.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  /**
   * Método que permite consultar las compañías en las que esta registrado un ejecutivo de cuenta
   * @param params
   */
  public fetchCompaniesExecutiveByUser = async (params: ParamsFetchCompaniesExecutiveByUser) => {
    try{

      const schedulings = await CourseScheduling.find({ account_executive: params.userId }).select('id client').populate([
        {path: 'client', select: 'slug name description logo background' }
      ]);

      let companies = schedulings?.map(scheduling => scheduling.client);

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          companies
        }
      });

    }catch(e){
      console.log('CompanyDataService => fetchCompaniesExecutiveByUser error: ', e);
      return responseUtility.buildResponseFailed('json');
    }
  }

}

export const companyDataService = new CompanyDataService();
export { CompanyDataService as DefaultDataCompanyCompanyDataService };
