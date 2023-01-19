// @import_dependencies_node Import libraries
const ObjectID = require('mongodb').ObjectID
import moment from 'moment';
// @end

// @import services
import { documentQueueService } from '@scnode_app/services/default/admin/documentQueue/documentQueueService';
import { courseSchedulingService } from './courseSchedulingService';
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
// @end

// @import models
import { CourseScheduling, DocumentQueue } from '@scnode_app/models';
// @end

// @import types
import { IAssociationsByCourseScheduling, IAssociateSchedules, IModelAssociation, AssociationType } from '@scnode_app/types/default/admin/course/courseSchedulingAssociationTypes';
import { ItemsToDuplicate } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
// @end

class CourseSchedulingAssociationService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public associationsByCourseScheduling = async (params: IAssociationsByCourseScheduling) => {

    const paging = (params.pageNumber && params.nPerPage) ? true : false

    const pageNumber = params.pageNumber ? (parseInt(params.pageNumber)) : 1
    const nPerPage = params.nPerPage ? (parseInt(params.nPerPage)) : 10

    let select = 'id metadata.service_id program schedulingAssociation'

    const where: any = {}

    if (params.course_scheduling) {
      where['schedulingAssociation.parent'] = params.course_scheduling
    }

    let registers = []
    let courseScheduling;
    let associationQueue = []

    try {

      if (!params.course_scheduling) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.associations.course_scheduling_required'})

      courseScheduling = await CourseScheduling.findOne({_id: params.course_scheduling})
      .select('id metadata.service_id program schedulingAssociation')
      .populate({ path: 'program', select: 'id name moodle_id code' })
      .lean()
      if (!courseScheduling) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.associations.course_scheduling_not_found'})

      registers = await CourseScheduling.find(where)
      .select(select)
      .populate({ path: 'program', select: 'id name moodle_id code' })
      .skip(paging ? (pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0) : null)
      .limit(paging ? nPerPage : null)
      .sort({ startDate: -1 })
      .lean()

      const documentQueueQuery = await DocumentQueue.find({
        type: 'CourseScheduling Association',
        'mixedParams.schedulingAssociation.parent': courseScheduling._id,
        status: 'New'
      })
      .select('id mixedParams')

      for (const queue of documentQueueQuery) {
        if (queue?.mixedParams?.schedulingAssociation) {
          associationQueue.push({...queue?.mixedParams?.schedulingAssociation})
        }
      }
    } catch (err) {
      console.log('err', err)
    }

    return responseUtility.buildResponseSuccess('json', null, {
      additional_parameters: {
        schedulings: [
          ...registers
        ],
        courseScheduling,
        associationQueue,
        total_register: (paging) ? await CourseScheduling.find(where).count() : 0,
        pageNumber: pageNumber,
        nPerPage: nPerPage
      }
    })
  }

  public associateSchedules = async (params: IAssociateSchedules) => {
    try {
      const associationLogs = []
      const associationErrors = []
      let generatingAssociation = false;

      if (!params.course_scheduling) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.associations.course_scheduling_required'})

      // @INFO: Consultando la programación padre
      const courseSchedulingMaster = await CourseScheduling.findOne({
        _id: params.course_scheduling
      })
      .select('id schedulingAssociation')
      .lean()
      if (!courseSchedulingMaster) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.associations.course_scheduling_not_found'})

      if (courseSchedulingMaster?.schedulingAssociation?.generatingAssociation === true) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.associations.generate_associations_in_progress'})

      // TODO: Validar que los nombres de los grupos sean unicos

      if (params.associations) {
        const searchInAssociations = params.associations.reduce((acc, element) => {
          acc[element.slug] = ++acc[element.slug] || 0;
          return acc;
        }, {});

        const associationsDuplicated = params.associations.filter( (element) => {
          return searchInAssociations[element.slug];
        });
        if (associationsDuplicated.length > 0) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.associations.duplicated'})

        for (const association of params.associations) {
          if (association.slug) {
            if (association._id) {
              const isMongoValid = await ObjectID.isValid(association._id)
              if (isMongoValid) {
                // @INFO: Consultar la programación
                const courseSchedulingChild = await CourseScheduling.findOne({_id: association._id}).select('id schedulingAssociation').lean();
                if (courseSchedulingChild) {
                  // @INFO: Insertar/Actualizar información de asociación del grupo hijo
                  if (courseSchedulingChild?.schedulingAssociation?.slug) {
                    const updateAssociationResponse = await this.updateSchedulingAssociationInfo(
                      courseSchedulingChild,
                      {
                        slug: association.slug
                      }
                    )
                    if (updateAssociationResponse.status === 'success') {
                      associationLogs.push(
                        {message: `La programación con identificador ${association._id} ha sido actualizada`}
                      )
                    } else {
                      associationErrors.push(
                        {message: `Ha ocurrido un error al insertar/actualizar la programación con identificador ${association._id}`}
                      )
                    }
                  } else {
                    const updateAssociationResponse = await this.updateSchedulingAssociationInfo(
                      courseSchedulingChild,
                      {
                        associationType: AssociationType.CHILD,
                        parent: courseSchedulingMaster._id,
                        personWhoGeneratedAssociation: params.user,
                        slug: association.slug,
                        date: moment().format('YYYY-MM-DD')
                      }
                    )
                    if (updateAssociationResponse.status === 'success') {
                      associationLogs.push(
                        {message: `La programación con identificador ${association._id} ha sido actualizada`}
                      )
                    } else {
                      associationErrors.push(
                        {message: `Ha ocurrido un error al insertar/actualizar la programación con identificador ${association._id}`}
                      )
                    }
                  }
                } else {
                  associationErrors.push(
                    {message: `La asociación con identificador ${association._id} no ha sido encontrada`}
                  )
                }
              } else {
                associationErrors.push(
                  {message: `La asociación con identificador ${association._id} no es valido`}
                )
              }
            } else if (association.unique) {
              const queueResponse = await this.addAssociateScheduleInQueue({
                associationType: AssociationType.CHILD,
                parent: courseSchedulingMaster._id,
                personWhoGeneratedAssociation: params.user,
                slug: association.slug,
                date: moment().format('YYYY-MM-DD')
              })
              if (queueResponse.status === 'success') {
                generatingAssociation = true;
                associationLogs.push(
                  {message: `La asociación con identificador ${association.unique} ha sido programada en la cola de tareas`}
                )
              } else {
                associationErrors.push(
                  {message: `Ha ocurrido un error al insertar/actualizar la programación con identificador ${association.unique}`}
                )
              }
            } else {
              associationErrors.push(
                {message: `El formato de la asociación no es valido`}
              )
            }
          } else {
            associationErrors.push(
              {message: `El formato de la asociación no es valido`}
            )
          }
        }
      }

      // @INFO: Insertar/Actualizar información de asociación del grupo maestro
      if (associationErrors.length === 0 && params.masterGroup) {
        if (courseSchedulingMaster?.schedulingAssociation?.slug) {
          await this.updateSchedulingAssociationInfo(
            courseSchedulingMaster,
            {
              generatingAssociation,
              slug: params.masterGroup
            }
          )
        } else {
          await this.updateSchedulingAssociationInfo(
            courseSchedulingMaster,
            {
              generatingAssociation,
              associationType: AssociationType.PARENT,
              personWhoGeneratedAssociation: params.user,
              slug: params.masterGroup,
              date: moment().format('YYYY-MM-DD')
            }
          )
        }
      }

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        associationLogs,
        associationErrors
      }})
    } catch(err) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  private addAssociateScheduleInQueue = async (params: IModelAssociation) => {
    try {
      const respoQueue: any = await documentQueueService.insertOrUpdate({
        status: 'New',
        type: 'CourseScheduling Association',
        userId: params.personWhoGeneratedAssociation,
        mixedParams: {
          schedulingAssociation: {
            ...params
          }
        }
      });
      if (respoQueue.status === 'error') return respoQueue;

      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        queue: respoQueue
      }})
    } catch (err) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  private updateSchedulingAssociationInfo = async (courseScheduling: {_id: string; schedulingAssociation?: IModelAssociation}, schedulingAssociation: IModelAssociation) => {
    try {
      const _schedulingAssociation = courseScheduling?.schedulingAssociation ? {...courseScheduling?.schedulingAssociation, ...schedulingAssociation} : {...schedulingAssociation}
      const response: any = await CourseScheduling.findByIdAndUpdate(
        courseScheduling._id,
        {
          schedulingAssociation: _schedulingAssociation
        },
        {
          useFindAndModify: false,
          new: true,
          lean: true,
        }
      )
      return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
        response
      }})
    } catch(err) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  public processAssociateSchedulesByDocumentQueue = async (params: {recordToProcess: any, mixedParams: {schedulingAssociation: IModelAssociation}}) => {
    try {
      // @INFO: Consultando la programación padre
      const courseSchedulingMaster = await CourseScheduling.findOne({
        _id: params?.mixedParams?.schedulingAssociation?.parent
      })
      .select('id schedulingAssociation')
      .lean()
      if (!courseSchedulingMaster) return responseUtility.buildResponseFailed('json', null, {error_key: 'course_scheduling.associations.course_scheduling_not_found'})

      // console.log('courseSchedulingMaster', courseSchedulingMaster)
      const duplicateResponse: any = await courseSchedulingService.duplicateCourseScheduling({
        courseSchedulingId: courseSchedulingMaster._id,
        itemsToDuplicate: [ItemsToDuplicate.COURSE_SCHEDULING, ItemsToDuplicate.COURSE_SCHEDULING_DETAILS]
      })

      if (duplicateResponse.status === 'success') {
        const updateAssociationResponse = await this.updateSchedulingAssociationInfo(
          duplicateResponse.newCourseScheduling,
          {
            ...params?.mixedParams?.schedulingAssociation
          }
        )
      }

      const respDocumentQueue: any = await documentQueueService.insertOrUpdate({
        id: params.recordToProcess.id,
        status: 'Complete',
        processLog: duplicateResponse?.status === 'success' ? duplicateResponse : undefined,
        errorLog: duplicateResponse?.status === 'error' ? duplicateResponse : undefined,
      });

      const existsAnyQueue = await DocumentQueue.find({
        type: 'CourseScheduling Association',
        'mixedParams.schedulingAssociation.parent': courseSchedulingMaster._id,
        status: 'New'
      })
      if (existsAnyQueue.length === 0) {
        // @INFO: Actualziando información de asociación del padre
        const updateAssociationResponse = await this.updateSchedulingAssociationInfo(
          courseSchedulingMaster,
          {
            generatingAssociation: false
          }
        )
      }
      return responseUtility.buildResponseSuccess('json', null, {
        additional_parameters: {
          processFile: {
            ...respDocumentQueue
          }
        }
      })
    } catch(err) {
      console.log('processAssociateSchedulesByDocumentQueue - error', err)
      return responseUtility.buildResponseFailed('json', null)
    }
  }
}

export const courseSchedulingAssociationService = new CourseSchedulingAssociationService();
export { CourseSchedulingAssociationService as DefaultAdminCourseCourseSchedulingAssociationService };
