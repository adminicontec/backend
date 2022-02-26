// @import_dependencies_node Import libraries
// @end

// @import services
import { roleService } from '@scnode_app/services/default/admin/secure/roleService'
import { userService } from '@scnode_app/services/default/admin/user/userService';
import { modularService } from '@scnode_app/services/default/admin/modular/modularService';
import { uploadService } from '@scnode_core/services/default/global/uploadService'
import { documentQueueService } from '@scnode_app/services/default/admin/documentQueue/documentQueueService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { queryUtility } from '@scnode_core/utilities/queryUtility';
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility';
// @end

// @import models
import { Modular, Role, AppModulePermission } from '@scnode_app/models'
import { TeacherProfile } from '@scnode_app/models';
// @end

// @import types
import { IQueryFind, QueryValues } from '@scnode_app/types/default/global/queryTypes'
import { IModular, IModularQuery } from '@scnode_app/types/default/admin/modular/modularTypes'
import { IMassiveLoad, IUploadFile, ITeacherQuery, ITeacher, IQualifiedProfessional } from '@scnode_app/types/default/admin/teacher/teacherTypes'
import { IQualifiedTeacher } from '@scnode_app/types/default/admin/qualifiedTeachers/qualifiedTeachersTypes'
import { IUser } from '@scnode_app/types/default/admin/user/userTypes'
import { IFileProcessResult } from '@scnode_app/types/default/admin/fileProcessResult/fileProcessResultTypes'
import { generalUtility } from '@scnode_core/utilities/generalUtility';

// @end

class TeacherService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  private default_document_path = 'documents/qualified';

  constructor() { }

  /**
   * Upload  of qualified teacher file and put it on a document queue
   */
  public upload = async (params: IUploadFile, files?: any) => {

    try {
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (files && files.file_xlsx && typeof files.file_xlsx === 'object') {
        if (files.file_xlsx.mimetype === mimeType) {
          const response_upload: any = await uploadService.uploadFile(files.file_xlsx, this.default_document_path);

          if (response_upload.status === 'error') return response_upload;

          // console.log('*********************************');
          // console.dir(response_upload, { depth: null, colors: true });
          // console.log('*********************************');

          // save record on documents_queue to trigger the  documentProcessor
          const respDocumentQueue: any = await documentQueueService.insertOrUpdate({
            status: 'New',
            type: 'Qualified Teacher',
            docPath: response_upload.path,
            userId: params.userID,
            sendEmail: params.sendEmail === 'true' ? true : false
          });

          if (respDocumentQueue.status == 'error') {
            return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'document.queue.insertOrUpdate.failed', params: { error: respDocumentQueue.error } } });
          }

          console.log('----------------------------');
          console.dir(respDocumentQueue, { depth: null, colors: true });
          console.log('----------------------------');

          return responseUtility.buildResponseSuccess('json', null, {
            additional_parameters: {
              upload: respDocumentQueue.documentQueue
            }
          });
        }
        else {
          return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.wrong_mime_type' } });
        }
      }
      else {
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.empty_file', params: { error: files } } });
      }
    }

    catch (e) {
      return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.empty_file', params: { error: e } } });
    }
  }


  public processFile = async (params: IMassiveLoad) => {

    console.log(">>>>>>>>>>> Begin Massive Load of Qualified Teachers")
    try {
      let singleProfessionalLoadContent: IQualifiedProfessional;
      let content = params.contentFile;
      let record = params.recordToProcess;

      console.log(content);

      // 0. Extracción de Cursos y Docentes calificados
      let dataModularMigration = await xlsxUtility.extractXLSX(content.data, 'Migración Modulares', 0);
      let modularMigration = [...new Map(dataModularMigration.map((x) => [x['Modular anterior'], x])).values()];

      // 1. Extracción de información de Docentes
      let dataWSTeachersBase = await xlsxUtility.extractXLSX(content.data, 'base docentes y tutores', 0);
      // 2. Extracción de Cursos y Docentes calificados
      let dataWSProfessionals = await xlsxUtility.extractXLSX(content.data, 'Profesionales calificados', 3);


      //let respProcessTeacherData = await this.processTeacherData(dataWSTeachersBase, 'base docentes y tutores');
      let respProcessQualifiedTeacherData: any = await this.processQualifiedTeacherData(dataWSProfessionals, modularMigration, 'Profesionales calificados');

      // Update processed record
      // processError

      const respDocumentQueue: any = await documentQueueService.insertOrUpdate({
        id: record.id,
        status: 'Complete',
        processLog: respProcessQualifiedTeacherData.qualifiedTeachers,
        errorLog: respProcessQualifiedTeacherData.errorLog
      });

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          processFile: {
            ...respDocumentQueue //respProcessQualifiedTeacherData
          }
        }
      })

    }
    catch (e) {
      return responseUtility.buildResponseFailed('json', e)
    }

  }

  /*
  Creación de usuarios con el rol de Teacher
  */
  private processTeacherData = async (dataWSTeachersBase: any, sheetname: string) => {

    let singleUserLoadContent: IUser;
    let processResult: IFileProcessResult;
    let processResultLog = [];
    let userLoadResponse = [];

    //#region   list of Roles
    let roles = {}
    const rolesResponse: any = await roleService.list()
    if (rolesResponse.status === 'success') {
      for await (const iterator of rolesResponse.roles) {
        roles[iterator.name] = iterator._id
      }
    }
    //#endregion

    //#region  dataWSDocentes
    try {
      if (dataWSTeachersBase != null) {
        console.log("Sheet content for: " + dataWSTeachersBase.length + " teachers")
        let index = 1;

        for await (const element of dataWSTeachersBase) {

          if (element['Documento de Identidad']) {

            singleUserLoadContent = {
              username: generalUtility.normalizeUsername(element['Documento de Identidad']),
              password: element['Documento de Identidad'].toString(),
              email: element['Correo Electrónico'],
              phoneNumber: (element['N° Celular']) ? element['N° Celular'].toString().replace(/ /g, "").trim() : '',
              roles: [roles['teacher']],
              sendEmail: false, //params.sendEmail
              profile: {
                doc_type: element['Tipo Documento'] ? element['Tipo Documento'] : 'CC',
                doc_number: element['Documento de Identidad'],
                first_name: element['Nombres'].trim(),
                last_name: element['Apellidos'].trim(),
                city: (element['Ubicación']) ? element['Ubicación'].trim() : '',
                country: 'Colombia',
                regional: element['Regional'],
                contractType: {
                  type: element['Tipo de Vinculación'],
                  isTeacher: element['DOCENTE'] ? true : false,
                  isTutor: element['TUTOR'] ? true : false,
                }
              }
            };

            // Creación de Usuario en CD y en Moodle.
            console.log('Carga >>> Username:' + element['Documento de Identidad']);

            // build process Response
            //#region   Insert User in Campus Digital and Moodle

            let respCampusDataUser: any = await userService.findBy({
              query: QueryValues.ONE,
              where: [{ field: 'profile.doc_number', value: singleUserLoadContent.profile.doc_number }]
            });

            if (respCampusDataUser.status == "error") {
              // USUARIO NO EXISTE EN CAMPUS VIRTUAL
              console.log(">>[CampusVirtual]: El usuario no existe. Creación de Nuevo Usuario");
            }
            else {
              console.log(">>[CampusVirtual]: El usuario ya existe. Actualización de datos datos.");
              singleUserLoadContent.id = respCampusDataUser.user._id.toString();
              console.log(singleUserLoadContent.id);
            }
            const respUser = await userService.insertOrUpdate(singleUserLoadContent);
            userLoadResponse.push(respUser);
            if (respUser.status == 'error') {
              console.log(respUser.message);

              processResult = {
                row: index,
                status: 'ERROR',
                messageProcess: 'DocumentID is empty',
                details: {
                  user: 'Empty',
                  fullname: singleUserLoadContent.profile.first_name + " " + singleUserLoadContent.profile.last_name
                }
              }
              //console.log(processResult)
              processResultLog.push(processResult);
              continue;
            }
            //#endregion   Insert User in Campus Digital and Moodle

            //#region  result after processing record
            processResult = {
              row: index,
              status: 'OK',
              messageProcess: '',
              details: {
                user: singleUserLoadContent.username,
                fullname: singleUserLoadContent.profile.first_name + " " + singleUserLoadContent.profile.last_name
              }
            }
            //console.log(processResult)
            processResultLog.push(processResult);
            //#endregion  result after processing record
          }
          else {
            //console.log("Error at line: " + index);

            processResult = {
              row: index,
              status: 'ERROR',
              messageProcess: 'DocumentID is empty',
              details: {
                user: 'Empty',
                fullname: singleUserLoadContent.profile.first_name + " " + singleUserLoadContent.profile.last_name
              }
            }
            //console.log(processResult)
            processResultLog.push(processResult);
          }
          index++
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            ...processResultLog
          }
        })

      }
      else {
        // Return Error
        console.log('Empty Doc:  "base docentes y tutores"');
        return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.empty_file', params: { sheetname: sheetname } } });
      }
      //#endregion dataWSDocentes
    }
    catch (e) {
      console.log('Error: ' + e);

      return responseUtility.buildResponseFailed('json', null, { error_key: { key: 'teacher_upload.failed_upload', params: { error: e } } });
    }
    //#endregion   dataWSDocente

  }

  private processQualifiedTeacherData = async (dataWSQualifiedTeachersBase: any,
    dataModularMigration: any,
    sheetname: string) => {

    let modularList: any = await modularService.list();

    let contentRowTeacher: IQualifiedProfessional;
    let registerQualifiedTeacher: IQualifiedTeacher;
    let processResult: IQualifiedTeacher[] = [];
    let processError = [];
    let newModulars = [];

    try {

      //#region - Update modulars from Migration
      // Insert the new Modulars from Migration file and then update the general Modular list
      console.log('################################################');
      for await (const row of dataModularMigration) {
        console.log("Search for  " + row['Modular nuevo']);
        let searchModular: any = modularList.modulars.find(field => field['name'].toLowerCase() == row['Modular nuevo'].toLowerCase());
        console.log('-----------------');
        if (!searchModular) {
          newModulars.push({
            anterior: row['Modular anterior'],
            nuevo: row['Modular nuevo'],
          });
          // Insert new Modular:
          const respModular: any = await modularService.insertOrUpdate({
            name: row['Modular nuevo'],
            description: row['Modular nuevo']
          });
          if (respModular.status == 'success') {
            console.log("Modular Insertion: " + respModular.modular._id + " - " + respModular.modular.name);
            modularList = await modularService.list();
          }
        }
      }
      //#endregion

      //#region     dataWSProfessionals
      // try {
      if (dataWSQualifiedTeachersBase != null) {
        console.log("Listado de Profesionales calificados");
        //console.log(dataWSProfessionals);

        let indexP = 5;
        for await (const element of dataWSQualifiedTeachersBase) {

          let flagAddRegister = false;

          contentRowTeacher = {
            documentID: element['Documento de Identidad'],
            email: element['Correo Electrónico'],
            modular: element['Modular'],
            courseCode: element['Código / Versión del Curso'],
            versionStatus: element['Estado de la Versión'],
            courseName: element['Nombre Curso'],
            qualifiedDate: element['Fecha Calificación']
          }

          //console.log(contentRowTeacher);

          //#region   ------------- MODULAR -------------
          // 2. Insert Modular: singleProfessionalLoadContent.modular

          if (contentRowTeacher.modular == null || contentRowTeacher.modular === '#N/D') {
            // error en modular
            console.log(" ERROR AT  ROW: [" + indexP + "]");

            processError.push({
              typeError: 'ModularEmpty',
              row: indexP,
              col: 'Modular',
              message: 'el valor del Modular está vacío',
              data: contentRowTeacher.modular
            });

            indexP++
            continue;
          }

          let modularID;

          let searchOldModular: any = dataModularMigration.find(field =>
            field['Modular anterior'].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") == contentRowTeacher.modular.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

          if (searchOldModular) {
            // take pair value for 'Modular nuevo' and get ModularId
            let localModular: any = modularList.modulars.find(x =>
              x.name.toLowerCase() == searchOldModular['Modular nuevo'].toLowerCase().trim());
            if (localModular) {
              // take ID
              // console.log('OLD:\t' + localModular.name + '\t[' + localModular._id) + ']';
              modularID = localModular._id;
              flagAddRegister = true;
            }
            else {
              // Si no existe ni con el viejo para reemplazar, ni con el nuevo, Insertar
              // const respModular: any = await modularService.insertOrUpdate({
              //   name: contentRowTeacher.modular,
              //   description: contentRowTeacher.modular
              // });
              // console.log("Modular Insertion: " + respModular.modular._id + " - " + respModular.modular.name);
              // modularID = respModular.modular._id;
            }
          }
          else {
            let searchNewModular: any = dataModularMigration.find(field =>
              field['Modular nuevo'].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") == contentRowTeacher.modular.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            //field['Modular nuevo'].toLowerCase() == contentRowTeacher.modular.toLowerCase());
            if (searchNewModular) {
              let localModular: any = modularList.modulars.find(x =>
                x.name.toLowerCase() == searchNewModular['Modular nuevo'].toLowerCase().trim());
              if (localModular) {
                // take ID
                console.log('NEW:\t' + localModular.name + '\t[' + localModular._id) + ']';
                modularID = localModular._id;
                flagAddRegister = true;
              }
            }
            else {
              console.log("-----------ROW: [" + indexP + "] --------------");
              console.log('Find: ' + contentRowTeacher.modular);
              console.log('normalize: [' + contentRowTeacher.modular.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() + ']');

              console.log(" Cant't find any equivalent to [" + contentRowTeacher.modular + "]");
              console.log(searchNewModular);

              processError.push({
                typeError: 'ModularMissmatch',
                message: 'Modular [' + contentRowTeacher.modular + '] no encontrado en hoja de Migración',
                row: indexP,
                col: 'Modular',
                data: contentRowTeacher.modular
              });
              indexP++
              continue;
            }
          }
          //#endregion

          //#region --------------- Get User Id from numDoc ---------------

          let respCampusDataUser: any = await userService.findBy({
            query: QueryValues.ONE,
            where: [{ field: 'profile.doc_number', value: contentRowTeacher.documentID }]
          });

          if (respCampusDataUser.status == "error") {
            // USUARIO NO EXISTE EN CAMPUS VIRTUAL
            console.log(">>[CampusVirtual]: Usuario no existe. No se puede crear registro");
            // log de error
            processError.push({
              typeError: 'UserNotFound',
              message: 'Usuario ' + contentRowTeacher.documentID + ' no encontrado',
              row: indexP,
              col: 'Documento de Identidad',
              data: contentRowTeacher.documentID
            });
            indexP++;
            continue;
          }

          console.log(">>[CampusVirtual]: Usuario encontrado. Inserción de registro");
          console.log(respCampusDataUser.user._id.toString());
          //#endregion

          //#region  ---- Registro de Docente Calificado
          registerQualifiedTeacher = {
            index: indexP,
            user: respCampusDataUser.user._id.toString(),
            modular: modularID, //(modularID) ? modularID : 'WARNING - ' + contentRowTeacher.modular,
            courseCode: contentRowTeacher.courseCode,
            courseName: contentRowTeacher.courseName,
            evaluationDate: new Date(contentRowTeacher.qualifiedDate),
            isEnabled: true,
            status: 'active'
          }
          processResult.push(registerQualifiedTeacher);
          //#endregion

          indexP++;
        }

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            qualifiedProcess: processResult.length,
            qualifiedTeachers: [
              ...processResult
            ],
            errorLog: [
              ...processError
            ]
            // ,
            // total_register: (paging) ? await qualifiedTeachers.length : 0,
            // pageNumber: pageNumber,
            // nPerPage: nPerPage
          }
        })

      }
      else {
        console.log('Empty Doc:  "Profesionales calificados"');
      }
    }
    catch (e) {
      console.log(e);
      return responseUtility.buildResponseFailed('json', e)
    }
    //#endregion  dataWSProfessionals

  }

  public list = async (filters: ITeacherQuery = {}) => {

    let qualifiedTeachers = [];

    const paging = (filters.pageNumber && filters.nPerPage) ? true : false
    const pageNumber = filters.pageNumber ? (parseInt(filters.pageNumber)) : 1
    const nPerPage = filters.nPerPage ? (parseInt(filters.nPerPage)) : 10

    console.log("Enter to Teacher service");

    try {
      // Consultando el ID de Permiso is_teacher
      let counter = 1;
      let roles_ids = [];
      const permission_teacher = await AppModulePermission.findOne({ name: "config:is_teacher" }).select("_id");

      if (permission_teacher) {
        let roles = await Role.find({ app_module_permissions: { $in: permission_teacher._id } }).select("_id");
        if (roles && roles.length > 0) {
          roles_ids = roles.reduce((accum, element) => {
            accum.push(element._id)
            return accum
          }, [])

          filters.roles = roles_ids;
        }
      }

      if (!filters.roles) {
        filters.roles = []
      }

      let teachers: any = await userService.list(filters);


      if (teachers.status == "error")
        return responseUtility.buildResponseFailed('json')


      console.log(teachers.users);

      teachers.users.forEach(element => {

        let teacherData: ITeacher = {
          position: counter,
          userData: element,

          // Inner query to get Courses
          courses: [
            // {
            //   modular: 'Calidad',
            //   name: 'first course',
            // },
            // {
            //   modular: 'Agroalimentario',
            //   name: 'second course',
            // },
          ]
        };
        qualifiedTeachers.push(teacherData);
        counter++;

      });

      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          qualifiedTeachers: [
            ...qualifiedTeachers
          ],
          total_register: (paging) ? await qualifiedTeachers.length : 0,
          pageNumber: pageNumber,
          nPerPage: nPerPage
        }
      })


    } catch (e) {
      return responseUtility.buildResponseFailed("json");
    }
  }

}


export const teacherService = new TeacherService();
export { TeacherService as DefaultAdminTeacherTeacherService };
