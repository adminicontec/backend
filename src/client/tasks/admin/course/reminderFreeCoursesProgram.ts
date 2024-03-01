// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
const ObjectID = require('mongodb').ObjectID
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import types
import {TaskParams} from '@scnode_core/types/default/task/taskTypes'
import { CertificateQueue, Transaction } from "@scnode_app/models";
import { TransactionStatus } from "@scnode_app/types/default/admin/transaction/transactionTypes";
import { CertificateQueueStatus } from "@scnode_app/types/default/admin/certificate/certificateTypes";
import { courseSchedulingNotificationsService } from "@scnode_app/services/default/admin/course/courseSchedulingNotificationsService";
// @end

class ReminderFreeCoursesProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    await this.validatePendingCertificationsPerUser()
    // @end

    return true; // Always return true | false
  }

  // @add_more_methods
  private validatePendingCertificationsPerUser = async () => {
    const certificationsThatNeedPayment = await CertificateQueue.find({
      needPayment: true,
      courseId: { $exists: true },
      status: CertificateQueueStatus.NEW
    }).select('_id')
    const certificationsThatNeedPaymentIds = certificationsThatNeedPayment?.map(({ _id }) => _id.toString())
    if (!certificationsThatNeedPaymentIds?.length) return
    const paidCertificationIds = await this.getPaidCertificationIds(certificationsThatNeedPaymentIds)
    const pendingCertificationIds = certificationsThatNeedPaymentIds?.filter((certificate) => !paidCertificationIds.includes(certificate))
    if (!pendingCertificationIds?.length) return
    const certificationsByUser = await this.getCertificationsByUser(pendingCertificationIds)
    for (const { user, services } of certificationsByUser) {
      await courseSchedulingNotificationsService.sendFreeMoocCertificationsReminder({
        user,
        services,
      })
    }
  }

  private getCertificationsByUser = async (pendingCertificationIds) => {
    const certificationsByUser = await CertificateQueue.aggregate([
      {
        $match: {
          _id: { $in: pendingCertificationIds?.map((id) => ObjectID(id)) }
        }
      },
      {
        $project: {
          userId: true,
          courseId: true,
        }
      },
      {
        $group: {
          _id: "$userId",
          certifications: {
            $addToSet: "$$ROOT"
          }
        }
      },
      {
        $unwind: "$certifications"
      },
      {
        $lookup: {
          from: 'users',
          localField: 'certifications.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          certifications: true,
          'user._id': true,
          'user.email': true,
          'user.profile': true,
        }
      },
      {
        $lookup: {
          from: 'course_schedulings',
          localField: 'certifications.courseId',
          foreignField: '_id',
          as: 'courseScheduling'
        }
      },
      {
        $unwind: "$courseScheduling"
      },
      {
        $project: {
          user: true,
          'courseScheduling._id': true,
          'courseScheduling.certificate': true,
          'courseScheduling.metadata': true,
          'courseScheduling.program': true,
        }
      },
      {
        $lookup: {
          from: 'programs',
          localField: 'courseScheduling.program',
          foreignField: '_id',
          as: 'courseScheduling.program'
        }
      },
      {
        $unwind: "$courseScheduling.program"
      },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          services: {
            $addToSet: "$courseScheduling"
          }
        }
      }
    ])
    return certificationsByUser || []
  }

  private getPaidCertificationIds = async (certificationsWithNeedPaymentIds) => {
    const paidCertificationsResult = await Transaction.aggregate([
      {
        $match: {
          certificateQueue: { $in: certificationsWithNeedPaymentIds?.map((id) => ObjectID(id)) },
          status: TransactionStatus.SUCCESS,
        }
      },
      {
        $project: {
          certificateQueue: true
        }
      },
      {
        $lookup: {
          from: 'certificate_queues',
          localField: 'certificateQueue',
          foreignField: '_id',
          as: 'certificateQueue'
        }
      },
      {
        $unwind: "$certificateQueue"
      },
      {
        $project: {
          'certificateQueue._id': true
        }
      },
      {
        $group: {
          _id: null,
          ids: {
            $addToSet: "$certificateQueue._id"
          }
        }
      }
    ])
    const paidCertificationIds = paidCertificationsResult?.[0]?.ids?.map((id) => id.toString())
    return paidCertificationIds || []
  }
  // @end
}

export const reminderFreeCoursesProgram = new ReminderFreeCoursesProgram();
export { ReminderFreeCoursesProgram };
