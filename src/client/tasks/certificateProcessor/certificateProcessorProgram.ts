// @import_services Import Services
import { DefaultPluginsTaskTaskService } from "@scnode_core/services/default/plugins/tasks/taskService";
import { certificateQueueService } from "@scnode_app/services/default/admin/certificateQueue/certificateQueueService";
import { certificateService } from "@scnode_app/services/default/huellaDeConfianza/certificate/certificateService";
// @end

// @import_models Import models
import { CertificateQueue } from "@scnode_app/models";
// @end

// @import_utilitites Import utilities
// @end

// @import types
import { TaskParams } from '@scnode_core/types/default/task/taskTypes'
import { QueryValues } from '@scnode_app/types/default/global/queryTypes'
// @end

class CertificateProcessorProgram extends DefaultPluginsTaskTaskService {

  /**
   * Metodo que contiene la logica de la tarea
   * @return Booleano que identifica si se pudo o no ejecutar la tarea
   */
  public run = async (taskParams: TaskParams) => {
    // @task_logic Add task logic
    // console.log("Init Task: Certificate Processor ");
    // await this.processNew()
    // await this.processReIssue()

    return true;
  }

  private processNew = async () => {
    console.log("1. Get all items on Certificate Queue [New] status")
    const select = ["New", "In-process"];
    const respQueueToProcess: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [
          { field: 'status', value: { $in: select } },
          // { field: 'courseId', value: '647908575eb784617f045948'},
          // { field: '_id', value: '64ff499113902c48e72264b1'}
        ]
      });

    if (respQueueToProcess.status === "error") return respQueueToProcess;

    if (respQueueToProcess.certificateQueue.length != 0) {
      console.log("Request for " + respQueueToProcess.certificateQueue.length + " certificates.");

      for await (const element of respQueueToProcess.certificateQueue) {
        if (element.status === 'In-process') {
          await CertificateQueue.findByIdAndUpdate(element._id, {
            status: 'New'
          })
        }
        const respSetCertificate: any = await certificateService.createCertificate({
          certificateQueueId: element._id,
          courseId: element.courseId,
          userId: element.userId._id,
          auxiliarId: element.auxiliar._id,
          certificateConsecutive: element.certificateConsecutive,
          certificateSettingId: element?.certificateSetting || undefined
        });

        if (respSetCertificate.status === "error") {
          console.log("¡Error al generar certificado!");
          console.log(respSetCertificate);
        }
        else {
          console.log("----------- END Process Set Certificate --------------------");
          console.log("Certificate generation successful!");
        }
      }
    }
    else {
      console.log("There're no certificates to request.");
    }
  }

  private processReIssue = async () => {
    console.log("2. Get all items on Certificate Queue [Re-issue] status")

    const selectIssue = ["Re-issue"];
    const respReissueQueueToProcess: any = await certificateQueueService.
      findBy({
        query: QueryValues.ALL, where: [{ field: 'status', value: { $in: selectIssue } }]
      });

    if (respReissueQueueToProcess.status === "error") return respReissueQueueToProcess;

    if (respReissueQueueToProcess.certificateQueue.length != 0) {

      console.log("Re-issue for " + respReissueQueueToProcess.certificateQueue.length + " certificates.");

      for await (const element of respReissueQueueToProcess.certificateQueue) {
        console.log('.............................');
        console.log(element);
        console.log('.............................');
        console.log(`${element._id} - ${element.certificateType}`);
        console.log(`Re-expedido por: ${element.auxiliar.profile.first_name} ${element.auxiliar.profile.last_name}.`)
        console.log(`Código: ${element.certificate.hash} `)

        // 1. Send request to process Certificate on HdC service.
        let respPutCertificate: any = await certificateService.editCertificate({
          certificateQueueId: element._id,
          courseId: element.courseId,
          userId: element.userId._id,
          auxiliarId: element.auxiliar._id,
          certificateConsecutive: element.certificateConsecutive,
          certificateHash: element.certificate.hash,
          certificateType: element.certificateType
        });

        if (respPutCertificate.status === "error") {
          console.log("¡Error al re-expedir el certificado!");
          console.log(respPutCertificate);
        }
        else {
          console.log("----------- END Process re-issue Certificate --------------------");
          console.log("Certificate re-issue successful!");
        }
      }
    } else {
      console.log("There're no certificates to re-issue.");
    }
  }

  // @add_more_methods
  // @end
}

export const certificateProcessorProgram = new CertificateProcessorProgram();
export { CertificateProcessorProgram };
