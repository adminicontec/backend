// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { certificateQueueService } from "@scnode_app/services/default/admin/certificateQueue/certificateQueueService";
import { certificateService } from "@scnode_app/services/default/huellaDeConfianza/certificate/certificateService"
import { notificationEventService } from "@scnode_app/services/default/events/notifications/notificationEventService";
// @end

// @import_models Import models
import { CourseScheduling } from "@scnode_app/models";
// @end

// @import_utilitites Import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import types
import { TaskParams } from '@scnode_core/types/default/task/taskTypes'
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { ICertificatePreview } from '@scnode_app/types/default/admin/certificate/certificateTypes'
import { IParticipantData, IParticipantDataByCertificateType } from '@scnode_app/types/default/events/notifications/notificationTypes'
// @end

class CertificatePreviewProcessorProgram extends DefaultPluginsTaskTaskService {

  private left_parentheses = '&#40;';
  private right_parentheses = '&#41;';

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    let responseProcessedDocument = [];
    let listOfParticipants: IParticipantData[] = [];

    console.log("Init Task: Certificate Preview Processor ");
    console.log("Get all requested certificates to process a PDF File")

    const select = ["Requested"];
    const selectAsComplete = ["Complete"];


    //#region 1. Make detail (PDF) request for every "Requested" status record on CertificateQueue

    let respQueueToPreview: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [
          { field: 'status', value: { $in: select } }
        ]
      });

    if (respQueueToPreview.certificateQueue.length != 0) {
      console.log("[" + respQueueToPreview.certificateQueue.length + "] Certificate(s) to preview. ");

      // First loop: get certificate PDF
      for await (let docPreview of respQueueToPreview.certificateQueue) {
        let queuePreview: ICertificatePreview;
        queuePreview = {
          certificate_queue: docPreview._id.toString(),
          hash: docPreview.certificate.hash,
          format: 2,
          template: 1,
          updateCertificate: true,
        };

        //Get preview of recent certificate
        let responsePreviewCertificate: any = await certificateService.previewCertificate(queuePreview);

        if (responsePreviewCertificate.status == 'success') {
          responseProcessedDocument.push(docPreview);
        }

      }

      if (responseProcessedDocument) {
        //#region Student Notifications

        // Second Loop: send email notifications to students whose certificate is OK and is enabled from Scheduling screen
        for await (const docProcessed of responseProcessedDocument) {

          console.log('docProcessed');
          console.log(docProcessed.certificateConsecutive);
          // Check if Certificate_students is enabled:
          let courseScheduling: any;
          courseScheduling = await CourseScheduling.findOne({ _id: docProcessed.courseId }).select('id program metadata certificate auditor_certificate certificate_students certificate_clients')
            .populate({ path: 'program', select: 'id name code' })

          console.log(`Send notification to ${docProcessed.userId.profile.first_name} ${docProcessed.userId.profile.last_name}? ${courseScheduling.certificate_students}`);

          if (courseScheduling.certificate_students && courseScheduling.certificate_students == true) {
            console.log("---------------------- -----------");
            console.log(`Envío de notificación a Estudiante ${docProcessed.filename} después de generar PDF :`);
            console.log("---------------------- -----------");

            const notificationResponse = await notificationEventService.sendNotificationParticipantCertificated({
              certificateQueueId: docProcessed._id,
              participantId: docProcessed.userId._id,
              courseSchedulingId: docProcessed.courseId,
              consecutive: docProcessed.certificateConsecutive
            });

            console.log(notificationResponse);
          }
        }

        //#endregion Student Notifications

        //#region Assistant Notifications

        // Third Loop: send notifications by e-mail to the operative assistants responsible for the emission.
        console.log('=====================================================');
        console.log('operative assistants notifications');
        console.log('=====================================================');

        // 1. groupBy Operative Assistant
        let groupByAssistant = responseProcessedDocument.reduce(function (r, a) {
          r[a.auxiliar._id] = r[a.auxiliar._id] || [];
          r[a.auxiliar._id].push(a);
          return r;
        }, {});

        for (const auxiliarKey of Object.keys(groupByAssistant)) {
          //let serviceId;
          let courseScheduling: any;
          for (const value of Object.values(groupByAssistant[auxiliarKey])) {

            let certificateData: any = value;

            courseScheduling = await CourseScheduling.findOne({ _id: certificateData.courseId }).select('id program metadata certificate auditor_certificate')
              .populate({ path: 'program', select: 'id name code' })

            if (!courseScheduling) {
              console.log(`Error trying to find course: ${certificateData.courseId}`)
              continue;
            };

            //serviceId = courseScheduling.metadata.service_id;

            listOfParticipants.push({
              serviceId: courseScheduling.metadata.service_id,
              participantId: certificateData.userId._id,
              participantFullName: `${certificateData.userId.profile.first_name} ${certificateData.userId.profile.last_name}`,
              courseSchedulingId: certificateData.courseId,
              courseSchedulingName: certificateData.message.replace(this.left_parentheses, '(').replace(this.right_parentheses, ')'), /// courseScheduling.program.name,
              certificateType: certificateData.certificateType,
              document: certificateData.userId.profile.doc_number,
              regional: certificateData.userId.profile.regional
            });
          }

          const keys = ['serviceId', 'certificateType'];

          // sort by serviceId
          listOfParticipants.sort((a, b) => a.serviceId.localeCompare(b.serviceId));

          // 2. groupBy Service ID - Certificate Type
          let groupByService: any = listOfParticipants.reduce((r, o) => {
            let { serviceId, certificateType } = o;

            let service = r[serviceId] || (r[serviceId] = {});
            let byCertificate = service[certificateType] || (service[certificateType] = []);
            byCertificate.push(o);

            return r;
          }, {});

          //#region Loop by Service ID

          for await (let [serviceKey, serviceGroup] of Object.entries(groupByService)) {

            let listOfParticpantsByCertificateType: IParticipantDataByCertificateType[] = [];

            console.log(`Service ID: ${serviceKey}`);

            for await (let [certificateTypeKey, certificateTypeGroup] of Object.entries(serviceGroup)) {
              let certData: IParticipantData[] = [];
              let certificateName = '';

              for await (let element of certificateTypeGroup) {
                console.log(`ServiceId: ${serviceKey} - certificateTypeKey: ${certificateTypeKey}`);

                certificateName = (element.certificateType == 'academic') ? courseScheduling.certificate : courseScheduling.auditor_certificate;

                certData.push({
                  participantId: element.participantId,
                  participantFullName: element.participantFullName,
                  courseSchedulingName: element.courseSchedulingName,
                  courseSchedulingId: element.courseSchedulingId,
                  certificateType: element.certificateType,
                  document: element.document,
                  regional: element.regional
                });
              }

              listOfParticpantsByCertificateType.push({
                certificateName: certificateName,
                participants: certData
              });
            }

            console.log('::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::');
            console.log(`Sending notification to Operative Assistant: ${auxiliarKey} - ServiceId ${serviceKey}`);
            console.log('::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::');

            const notificationResponseAuxiliar = await notificationEventService.sendNotificationCertificateCompleteToAuxiliar({
              auxiliarId: auxiliarKey,
              serviceId: serviceKey,
              participants: listOfParticpantsByCertificateType
            });
            console.log(notificationResponseAuxiliar);

          }
          console.log('=====================================================');

        }
        //#endregion Assistant Notifications

        //#endregion
      }
      else {
        console.log("There're no certificates to preview.");
      }

    }
    else {
      console.log("There're no certificates to process as PDF.");
    }
    //#endregion


    //#region 2. Sending notifications of students who were held due to certificate_students condition

    let respNotificationsOnHold: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [
          { field: 'status', value: { $in: selectAsComplete } },
          { field: 'notificationSent', value: { $in: [null, false] } }
        ]
      });

    for (let notificationToSend of respNotificationsOnHold.certificateQueue) {

      // Check if Certificate_students is enabled:
      let courseScheduling: any;
      courseScheduling = await CourseScheduling.findOne({ _id: notificationToSend.courseId }).select('id program metadata certificate auditor_certificate certificate_students certificate_clients')
        .populate({ path: 'program', select: 'id name code' })

      console.log(`Envío de notificación pendiente a ${notificationToSend.userId.profile.first_name} ${notificationToSend.userId.profile.last_name}? `);

      if (courseScheduling.certificate_students && courseScheduling.certificate_students == true) {

        const notificationResponse = await notificationEventService.sendNotificationParticipantCertificated({
          certificateQueueId: notificationToSend._id,
          participantId: notificationToSend.userId._id,
          courseSchedulingId: notificationToSend.courseId,
          consecutive: notificationToSend.certificateConsecutive
        });
        console.log("---------------------- -----------");
        console.log(`${notificationToSend.userId._id} - ${notificationToSend.courseId}`);
        console.log(notificationResponse);
        console.log("---------------------- -----------");
      }
      else {
        console.log('No se envía notificación pendiente a estudiante:');
      }

      // if (notificationResponse.status == "error") {
      //   flagNotificationSent = false;
      // }

      // let responseCertQueue: any = await certificateQueueService.insertOrUpdate({
      //   id: notificationToSend._id,
      //   notificationSent: flagNotificationSent
      // });

    }

    //#endregion

    // @end
    return true; // Always return true | false
  }


  // @add_more_methods
  // @end
}

export const certificatePreviewProcessorProgram = new CertificatePreviewProcessorProgram();
export { CertificatePreviewProcessorProgram };
