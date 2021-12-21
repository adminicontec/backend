// @import_dependencies_node Import libraries
// @end

// @import services
import {bannerService} from '@scnode_app/services/default/admin/banner/bannerService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { Banner } from '@scnode_app/models';
// @end

// @import types
import {IFetchBanners} from '@scnode_app/types/default/data/banner/bannerDataTypes'
// @end

class BannerDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar los banners
   * @param params Parametros que permiten consultar la data
   * @returns
   */
  public fetchBanners = async (params: IFetchBanners) => {

    try {

      const paging = (params.pageNumber && params.nPerPage) ? true : false

      const pageNumber= params.pageNumber ? (parseInt(params.pageNumber)) : 1
      const nPerPage= params.nPerPage ? (parseInt(params.nPerPage)) : 10

      let select = 'id title content coverUrl isActive action location'
      if (params.select) {
        select = params.select
      }

      let where = {}

      if(params.search){
        const search = params.search
        where = {
          ...where,
          $or:[
            {title: { $regex: '.*' + search + '.*',$options: 'i' }},
            {content: { $regex: '.*' + search + '.*',$options: 'i' }},
          ]
        }
      }

      if (params.location) {
        where['location'] = params.location
      } else {
        where['location'] = {$exists: false}
      }

      if (typeof params.isActive === 'undefined' || params.isActive === true) {
        where['isActive'] = true
      }

      let sort = null
      if (params.sort) {
        sort = {}
        sort[params.sort.field] = params.sort.direction
      }

      let registers = []
      try {
        registers =  await Banner.find(where)
        .select(select)
        .skip(paging ? (pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0) : null)
        .limit(paging ? nPerPage : null)
        .sort(sort)
        .lean()

        for await (const register of registers) {
          if (register.coverUrl) {
            register.coverUrl = bannerService.coverUrl(register)
          }
        }
      } catch (e) {}

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          banners: [
            ...registers
          ],
          total_register: (paging) ? await Banner.find(where).count() : 0,
          pageNumber: pageNumber,
          nPerPage: nPerPage,
          test: 'test'
        }
      })

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const bannerDataService = new BannerDataService();
export { BannerDataService as DefaultDataBannerBannerDataService };
