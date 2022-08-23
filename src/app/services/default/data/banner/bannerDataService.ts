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
import { IBanner } from '@scnode_app/types/default/admin/banner/bannerTypes';
import moment from 'moment';
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

      let select = 'id title content coverUrl isActive action location start_date end_date locations registerUrl'
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

      if (params.locations) {
        if (params.locationsGrouped) {
          where['locations'] = {$all: params.locations}
        } else  {
          where['locations'] = {$in: params.locations}
        }
      }

      // if (params.location) {
      //   where['location'] = params.location
      // } else {
      //   where['location'] = {$in: [undefined, null]}
      // }

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

      if (params.filterByDate) {
        registers = this.getValidBanners(registers)
      }

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

  /**
   * @INFO Obtener los banner validos entre dos fechas
   */
  public getValidBanners = (banners: IBanner[]) => {
    if (!banners.length) return banners
    const newBanners: IBanner[] = []
    banners.forEach((b) => {
      if (b.start_date && b.end_date) {
        const date1 = new Date(b.start_date)
        const date2 = new Date(b.end_date)
        if (moment().isBetween(date1, date2)) {
          newBanners.push(b)
        }
      } else if (b.start_date) {
        const date1 = new Date(b.start_date)
        if (moment().isAfter(date1)) {
          newBanners.push(b)
        }
      } else if (b.end_date) {
        const date1 = new Date(b.end_date)
        if (moment().isBefore(date1)) {
          newBanners.push(b)
        }
      } else {
        newBanners.push(b)
      }
    })
    return newBanners
  }

}

export const bannerDataService = new BannerDataService();
export { BannerDataService as DefaultDataBannerBannerDataService };
