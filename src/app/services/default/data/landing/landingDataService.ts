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
import { ILanding } from '@scnode_app/types/default/admin/landing/landingTypes';
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

      const landing: ILanding = await Landing.findOne({slug: params.slug})
      .populate({path: 'trainings.course', select: 'id program', populate: {
        path: 'program', select: 'id name'
      }})
      .populate({ path: 'tutorials.roles', select: 'id name description' })
      .populate({ path: 'tutorials.publicGroups', select: 'id name position' })
      .select('id title_page title_training title_references title_posts article tutorials trainings scheduling descriptive_training our_clients references forums alliances')
      .lean()

      if (landing) {
        if (landing.article && landing.article.coverUrl) {
          // @ts-ignore
          landing.article.coverFile = landingService.articleCoverUrl(landing.article)
        }

        if (landing.trainings) {
          landing.trainings = await landingService.getExtraInfo(landing.trainings)
        }

        if (landing.scheduling) {
          for (const scheduling of landing.scheduling) {
            if (scheduling.attachedUrl) {
              // @ts-ignore
              scheduling.attachedFile = landingService.schedulingAttachedUrl(scheduling)
            }
          }
        }

        if (landing.alliances) {
          for (const alliance of landing.alliances) {
            if (alliance.logoUrl) {
              // @ts-ignore
              alliance.logoFile = landingService.allianceLogoUrl(alliance)
            }
            const brochuresLength = alliance?.brochures?.length ? alliance.brochures.length : 0
            for (let idx = 0; idx < brochuresLength; idx++) {
              alliance.brochures[idx].fileUrl = landingService.allianceBrochureUrl(alliance.brochures[idx])
            }
          }
          if (params.onlyActiveAlliances) {
            landing.alliances = landing.alliances.filter((r) => r.status)
          }
        }

        if (landing.our_clients) {
          for (const client of landing.our_clients) {
            if (client.url) {
              client.url = landingService.ourClientsImageUrl(client.url)
            }
          }
        }

        if (landing.references) {
          for (const reference of landing.references) {
            if (reference.url) {
              reference.url = landingService.referenceImageUrl(reference.url)
            }
          }
          if (params.onlyActiveReference) {
            landing.references = landing.references.filter((r) => r.active || r.active === undefined)
          }
        }

        if (landing.tutorials) {
          for (const tutorial of landing.tutorials) {
            if (tutorial.imageUrl) {
              tutorial.imageUrl = landingService.getTutorialImageUrl(tutorial.imageUrl)
            }
            if (tutorial.attachUrl) {
              tutorial.attachUrl = landingService.getTutorialAttachUrl(tutorial.attachUrl)
            }
          }
          if (params.onlyActiveTutorials) {
            landing.tutorials = landing.tutorials.filter((r) => r.active)
          }
          if (params.onlyPublicTutorials) {
            landing.tutorials = landing.tutorials.filter((r) => !r.private)
          }
        }

        if (landing.descriptive_training && landing.descriptive_training.image) {
          landing.descriptive_training.image = landingService.descriptiveTrainingImageUrl(landing.descriptive_training.image)
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
