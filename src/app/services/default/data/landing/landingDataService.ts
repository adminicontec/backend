// @import_dependencies_node Import libraries
// @end

// @import services
import {landingService} from '@scnode_app/services/default/admin/landing/landingService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { Landing } from '@scnode_app/models';
// @end

// @import types
import {IFetchLandingData} from '@scnode_app/types/default/data/landing/landingDataTypes'
// @end

class LandingDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar información de un landing
   * @param params
   * @returns
   */
   public fetchLandingData = async (params: IFetchLandingData) => {

    try {

      const landing = await Landing.findOne({slug: params.slug})
      .select('id title_page article trainings scheduling')
      .lean()

      if (landing) {
        if (landing.article && landing.article.coverUrl) {
          landing.article.coverFile = landingService.articleCoverUrl(landing.article)
        }

        if (landing.trainings) {
          for (const training of landing.trainings) {
            if (training.attachedUrl) {
              training.attachedFile = landingService.trainingAttachedUrl(training)
            }
          }
        }

        if (landing.scheduling) {
          for (const scheduling of landing.scheduling) {
            if (scheduling.attachedUrl) {
              scheduling.attachedFile = landingService.schedulingAttachedUrl(scheduling)
            }
          }
        }
      }

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        landing
      }})
    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }
}

export const landingDataService = new LandingDataService();
export { LandingDataService as DefaultDataLandingLandingDataService };
