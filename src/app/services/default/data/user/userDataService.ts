// @import_dependencies_node Import libraries
import moment from 'moment'
// @end

// @import services
import {userService} from '@scnode_app/services/default/admin/user/userService'
import {certificateService} from '@scnode_app/services/default/huellaDeConfianza/certificate/certificateService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CertificateQueue, User } from '@scnode_app/models';
// @end

// @import types
import {IFetchUserInfo} from '@scnode_app/types/default/data/user/userDataTypes'
import { transactionService } from '@scnode_app/services/default/admin/transaction/transactionService';
import { CertificateQueueStatus } from '@scnode_app/types/default/admin/certificate/certificateTypes';
// @end

class UserDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar la información del usuario
   * @param params Filtros para buscar el elemento
   * @returns
   */
   public fetchUserInfo = async (params: IFetchUserInfo) => {

    try {
      const user: any = await User.findOne({
        _id: params.user_id
      })
      .populate({path: 'roles', select: 'id name description'})
      .lean()

      if (!user) return responseUtility.buildResponseFailed('json', null, {error_key: 'user.not_found'})

      let fullName = ''
      if (user.profile && user.profile.first_name) fullName += `${user.profile.first_name} `
      if (user.profile && user.profile.last_name) fullName += `${user.profile.last_name} `

      let roles = []
      if (user.roles) {
        roles = user.roles.reduce((accum, element) => {
          accum.push(element.description)
          return accum
        }, [])
      }

      const _certifications = await CertificateQueue.find({
        userId: user._id,
        $or: [
          { status: {$in: ['Complete']} },
          { needPayment: true }
        ]
      })
      .select('id userId courseId certificate status needPayment')
      .populate({path: 'courseId', select: 'id program certificate_students certificatePriceCOP', populate: [{
        path: 'program', select: 'id name'
      }]})
      .populate({ path: 'certificateSetting', select: '_id certificateName certificationType' });
      console.log(_certifications)

      const formatCOP = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
      })

      const certifications = _certifications.reduce((accum, element) => {
        if (element?.courseId?.certificate_students || element?.needPayment) {
          const certificatePrice = element?.courseId?.certificatePriceCOP
          accum.push({
            key: element?._id,
            _id: element?._id,
            title: !!element?.certificateSetting ? element?.certificateSetting?.certificateName : element?.certificate.title ||  '',
            date: moment(element?.certificate.date).format('YYYY-MM-DD'), //moment(element.created_at).format('YYYY-MM-DD'),
            hash: element?.certificate?.hash,
            url: element?.certificate?.url,
            status: element?.status,
            imagePath: element?.certificate?.imagePath ? certificateService.certificateUrl(element?.certificate.imagePath) : null,
            pdfPath: element?.certificate?.hash ? certificateService.certificateUrlV2(element?.certificate) : null,
            certificateSetting: element?.certificateSetting,
            certificate: element?.certificate,
            urlDownload: element?.certificate?.hash ? certificateService.certificateUrlV2(element?.certificate) : null,
            urlCredencial: element?.certificate?.urlCredencial || null,
            needPayment: element?.needPayment,
            ...(certificatePrice ? {
              priceCOP: Number(certificatePrice),
              priceCOPFormatted: formatCOP.format(Number(certificatePrice))
            }: {})
          })
        }
        return accum
      }, [])

      for (const certificate of certifications) {
        if (certificate?.needPayment) {
          const certificateWasPaid = await transactionService.certificateWasPaid(certificate?._id?.toString())
          certificate.wasPaid = certificateWasPaid
          if (!certificateWasPaid) {
            const { status, url } = await transactionService.certificateHasPendingTransaction(certificate?._id?.toString())
            certificate.transactionIsPending = status
            certificate.transactionURL = url
          }
        }
      }

      const userInfo = {
        avatar: userService.avatarUrl(user),
        fullName: fullName,
        program: null,
        cell_phone: (user.phoneNumber) ? user.phoneNumber : null,
        email: (user.email) ? user.email : null,
        roles: (roles.length > 0) ? roles.join(',') : null,
        lastLogin: (user.last_login) ? moment(user.last_login).format('DD/MM/YYYY') : null,
        hasCertifications: certifications.length > 0 ? true : false,
        certifications: certifications,
        docNumber: user?.profile?.doc_number
      }

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        user: userInfo
      }})

    } catch (e) {
      return responseUtility.buildResponseFailed('json')
    }
  }

}

export const userDataService = new UserDataService();
export { UserDataService as DefaultDataUserUserDataService };
