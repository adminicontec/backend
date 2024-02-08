// @import_dependencies_node Import libraries
import * as XLSX from "xlsx";
const ObjectID = require('mongodb').ObjectID
import moment from "moment";
// @end

// @import services
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from "@scnode_core/utilities/generalUtility";
import { xlsxUtility } from "@scnode_core/utilities/xlsx/xlsxUtility";
// @end

// @import models
import { User, CourseSchedulingMode, CourseSchedulingStatus, CourseScheduling, CourseSchedulingDetails, Enrollment, CertificateQueue, Program, CourseSchedulingInformation } from '@scnode_app/models';
// @end

// @import types
import { IFactoryGenerateReport } from '@scnode_app/types/default/data/reports/reportsFactoryTypes';
// @end

export interface IReportByModalityStructure {
  title: string,
  pages: IReportByModalityPerPage[]
}

export interface IReportByModalityPerPage {
  title: string;
  queryRange?: {
    reportStartDate: string | undefined,
    reportEndDate: string | undefined,
  };
  reportDate: string;
  personWhoGeneratesReport: string;
  data: IReportPage
}

export interface IReportPage {
  _id: string;
  programName: string;
  modular: string;
  programCode: string;
  serviceId: string;
  modalityName: string;
  regional: string;
  city: string;
  companyName: string;
  accountExecutive: string;
  courses: IReportCourse[];
  totalDuration: number;
  totalDurationFormated: string;
  totalCourses: number;
  participants: IReportParticipant[];
  isVirtual: boolean;
  isAuditor: boolean;
  isAuditorCerficateEnabled: boolean,
  firstCertificateIsAuditor: boolean,
  typeCourse?: string
}

export interface IReportCourse {
  _id: string;
  courseName: string;
  teacher: string;
  startDate: string;
  endDate: string;
  courseCode: string;
  duration: string;
}

export interface IReportParticipant {
  index: number;
  docNumber: string;
  student: string;
  regional: string;
  city: string;
  accountExecutive: string;
  attendance: {
    attendanceByCourse: Record<string, {value: number;}>,
    totalHoursAttended: number,
    totalAttendancePercentage: number
  },
  progress: {
    progressByCourse: Record<string, {value: number;}>,
    percentageOfProgressInTheProgram: number;
    forumNote: number;
    taskNote: number;
    evaluationNote: number;
    finalNote: number;
  },
  certificationData?: {
    isAuditorCerficateEnabled?: boolean,
    firstCertificateIsAuditor?: boolean,
    certificationLabel?: string,
    virtualProgress: number,
    virtualActivities: number,
    assistance: number,
    auditorCertificate: {
      certificationLabel: string,
      auditorExamScore: number,
    },
    firstCertificateIsAuditorContent: {
      auditorExamScore: number
    },
  }
  certification: {
    totalAssistanceCertification: string;
    partialCertification: string;
    virtualCertification: string;
    virtualApprovedExamAuditor: string;
    virtualCertificationType: string;
    certificateReleaseDate: string;
    personWhoReleasesCertificate: string;
    auditorCertificationType: string;
  },
  auditor: {
    examNote: number;
    examApproval: string;
  }
}

export interface ICourseSchedulingInfoByParticipantAndCourse {
  _id: string,
  schedulingDetails: string,
  attendanceScore: number
  progressPercentage: number
}
export interface ICourseSchedulingInfoByParticipant {
  generalData: {
    _id: string,
    auditCertificateType: string,
    user: string,
    courseScheduling: string,
    totalAttendanceScore: number,
    totalAttendanceHours: number,
    forumsScore: number,
    taskScore: number,
    examsScore: number,
    totalScore: number,
    completion: number,
    auditExamScore: number,
    isAuditExamApprove: boolean,
    isPartialCertification: boolean,
    isAttendanceCertification: boolean,
    certificationDate: string;
    assistanceCertificate: string,
    certificationData?: {
      isAuditorCerficateEnabled?: boolean,
      firstCertificateIsAuditor?: boolean,
      certificationLabel?: string,
      virtualProgress: number,
      virtualActivities: number,
      assistance: number,
      auditorCertificate: {
        certificationLabel: string,
        auditorExamScore: number,
      },
      firstCertificateIsAuditorContent: {
        auditorExamScore: number
      },
    }
  },
  courses: Record<string, ICourseSchedulingInfoByParticipantAndCourse>
}

class ReportByModalityService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public generateReport = async (params: IFactoryGenerateReport) => {
    try {
      const userLogged: any = await User.findOne({ _id: params.user }).select('id profile.first_name profile.last_name')

      if (!params.modality) return responseUtility.buildResponseFailed('json', null, {error_key: 'reports.factory.report_modality_required'})
      // @INFO: Consultando encuestas programadas
      const courseSchedulingMode = await CourseSchedulingMode.findOne({_id: params.modality, moodle_id: {$exists: true}}).select('id name')
      if (!courseSchedulingMode) return responseUtility.buildResponseFailed('json')

      const courseSchedulingStatus = await CourseSchedulingStatus.find().select('id name')
      if (!courseSchedulingStatus) return responseUtility.buildResponseFailed('json')

      const courseSchedulingStatusInfo = courseSchedulingStatus.reduce((accum, element) => {
        if (!accum[element.name]) {
          accum[element.name] = element;
        }
        return accum
      }, {})

      let where: any = {
        schedulingMode: courseSchedulingMode._id,
        schedulingStatus: {$in: [
          courseSchedulingStatusInfo['Confirmado']._id,
          courseSchedulingStatusInfo['Ejecutado']._id,
          // courseSchedulingStatusInfo['Cancelado']._id,
        ]}
      }

      if (params.courseSchedulings) {
        where['_id'] = {$in: params.courseSchedulings}
      } else if (params.serviceIds) {
        where['metadata.service_id'] = {$in: params.serviceIds}
      }

      if (params.auditor === true || params.auditor === false) {
        const programs = await Program.find({isAuditor: params.auditor}).select('id').lean()
        const programIds = programs.reduce((accum, element) => {
          accum.push(element._id)
          return accum
        }, [])
        where['program'] = {$in: programIds}
      }

      if (params?.reportStartDate && params?.reportEndDate) {
        where['startDate'] = {$gte: new Date(`${params.reportStartDate}T00:00:00Z`), $lte: new Date(`${params.reportEndDate}T23:59:59Z`)}
      }

      const courseSchedulings = await CourseScheduling.find(where)
      .select('id metadata schedulingMode modular program client city schedulingType regional account_executive startDate endDate duration typeCourse')
      .populate({path: 'schedulingMode', select: 'id name'})
      .populate({path: 'modular', select: 'id name'})
      .populate({path: 'program', select: 'id name code isAuditor'})
      .populate({path: 'client', select: 'id name'})
      .populate({path: 'city', select: 'id name'})
      .populate({path: 'schedulingType', select: 'id name'})
      .populate({path: 'regional', select: 'id name'})
      .populate({path: 'account_executive', select: 'id profile.first_name profile.last_name'})
      .lean()

      const courseSchedulingIds = courseSchedulings.reduce((accum, element) => {
        accum.push(element._id.toString())
        return accum
      }, [])

      let courseSchedulingDetails = undefined;

      if (courseSchedulingIds.length > 0) {
        const details = await CourseSchedulingDetails.find({
          course_scheduling: {$in: courseSchedulingIds}
        })
        .select('id course_scheduling teacher course startDate endDate duration sessions')
        .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
        .populate({path: 'course', select: 'id name code'})
        .lean();

        courseSchedulingDetails = {};
        courseSchedulingDetails = details.reduce((accum, element) => {
          if (element?.course_scheduling) {
            if (!accum[element.course_scheduling.toString()]) {
              accum[element.course_scheduling.toString()] = []
            }
            accum[element.course_scheduling.toString()].push(element)
          }
          return accum
        }, {})
      }

      let participantsByProgram = {}
      let certificationsByProgram = {}
      let participantsInformationByProgram = {}

      if (courseSchedulingIds.length > 0) {
        const enrolledByProgramQuery = await Enrollment.find({
          course_scheduling: {
            $in: courseSchedulingIds.reduce((accum, element) => {
              accum.push(ObjectID(element))
              return accum
            },[])
          }
        })
        .select('id user course_scheduling')
        .populate({path: 'user', select: 'id profile.first_name profile.last_name profile.doc_number'})

        if (enrolledByProgramQuery.length > 0) {
          participantsByProgram = enrolledByProgramQuery.reduce((accum, element) => {
            if (element.course_scheduling) {
              if (!accum[element.course_scheduling.toString()]) {
                accum[element.course_scheduling.toString()] = [];
              }
              accum[element.course_scheduling.toString()].push(element)
            }
            return accum
          }, {})
        }

        const certificationsByProgramQuery = await CertificateQueue.find({
          courseId: {
            $in: courseSchedulingIds.reduce((accum, element) => {
              accum.push(ObjectID(element))
              return accum
            },[])
          },
          status: 'Complete'
        })
        .select('id courseId userId created_at auxiliar status certificateType certificate.date')
        .populate({path: 'auxiliar', select: 'id profile.first_name profile.last_name profile.doc_number'})

        if (certificationsByProgramQuery.length > 0) {
          certificationsByProgram = certificationsByProgramQuery.reduce((accum, element) => {
            if (element.courseId && element.userId && element.certificateType) {
              if (!accum[element.courseId.toString()]) {
                accum[element.courseId.toString()] = {};
              }

              if (!accum[element.courseId.toString()][element.userId.toString()]) {
                accum[element.courseId.toString()][element.userId.toString()] = {};
              }

              if (!accum[element.courseId.toString()][element.userId.toString()][element.certificateType.toString()]) {
                accum[element.courseId.toString()][element.userId.toString()][element.certificateType.toString()] = element;
              }
              // accum[element.courseId.toString()].push(element)
            }
            return accum
          }, {})
        }

        const courseSchedulingInformationByProgramQuery = await CourseSchedulingInformation.find({
          courseScheduling: {
            $in: courseSchedulingIds.reduce((accum, element) => {
              accum.push(ObjectID(element))
              return accum
            },[])
          },
        })
        .select('user courseScheduling totalAttendanceHours totalAttendanceScore auditCertificateType forumsScore taskScore examsScore totalScore completion auditExamScore isAuditExamApprove isPartialCertification isAttendanceCertification courses certificationDate assistanceCertificate certificationData')
        .lean()

        if (courseSchedulingInformationByProgramQuery.length > 0) {
          participantsInformationByProgram = courseSchedulingInformationByProgramQuery.reduce((accum, element) => {
            if (element.courseScheduling && element.user) {
              if (!accum[element.courseScheduling.toString()]) {
                accum[element.courseScheduling.toString()] = {};
              }

              if (!accum[element.courseScheduling.toString()][element.user.toString()]) {
                accum[element.courseScheduling.toString()][element.user.toString()] = {
                  generalData: {...element, courses: undefined},
                  courses: {}
                };
              }

              if (element.courses) {
                const coursesData = element.courses.reduce((_accum, _element) => {
                  if (_element.schedulingDetails) {
                    if (!_accum[_element.schedulingDetails.toString()]) {
                      _accum[_element.schedulingDetails.toString()] = _element;
                    }
                  }
                  return _accum;
                }, {})

                accum[element.courseScheduling.toString()][element.user.toString()].courses = coursesData
              }
            }
            return accum
          }, {})
        }
      }

      const time = new Date().getTime()
      // @INFO: Se define el formato del reporte, xlsx por defecto
      const output_format: any = params.output_format ? params.output_format : 'xlsx'
      const title: any = params.title ? `${params.title}_${time}` : `reporte_por_modalidad_${time}`

      const report: IReportByModalityStructure = {
        title,
        pages: []
      }

      for (const courseScheduling of courseSchedulings) {
        const reportDataPerPage: IReportByModalityPerPage = {
          title: `${courseScheduling?.metadata?.service_id}_${courseScheduling?.program?.code}`,
          queryRange: {
            reportStartDate: params.reportStartDate,
            reportEndDate: params.reportEndDate
          },
          reportDate: moment().format('DD/MM/YYYY'),
          personWhoGeneratesReport: (userLogged?.profile) ? `${userLogged?.profile.first_name} ${userLogged?.profile.last_name}` : '-',
          data: undefined
        }

        const itemBase: IReportPage = {
          _id: courseScheduling._id,
          programName: courseScheduling?.program?.name || '-',
          modular: courseScheduling?.modular?.name || '-',
          programCode: courseScheduling?.program?.code || '-',
          serviceId: courseScheduling?.metadata?.service_id || '-',
          modalityName: courseScheduling?.schedulingMode?.name || '-',
          regional: courseScheduling?.regional?.name || '-',
          city: courseScheduling?.city?.name || '-',
          companyName: courseScheduling?.client?.name || '-',
          accountExecutive: (courseScheduling?.account_executive?.profile) ? `${courseScheduling?.account_executive?.profile.first_name} ${courseScheduling?.account_executive?.profile.last_name}` : '-',
          typeCourse: courseScheduling?.typeCourse === 'free' ? 'Gratuito' : courseScheduling?.typeCourse === 'mooc' ? 'Mooc' : null,
          courses: [],
          totalDuration: 0,
          totalDurationFormated: '0h',
          totalCourses: 0,
          participants: [],
          isVirtual: courseScheduling?.schedulingMode?.name === 'Virtual' ? true : false,
          // isAuditor: courseScheduling?.program?.isAuditor || false,
          isAuditor: false,
          isAuditorCerficateEnabled: false,
          firstCertificateIsAuditor: false,
        }

        if (courseSchedulingDetails && courseSchedulingDetails[courseScheduling._id.toString()]) {
          const courses = courseSchedulingDetails[courseScheduling._id.toString()]
          for (const course of courses) {
            let duration_scheduling = parseInt(course.duration)
            if (course.sessions && course.sessions.length > 0) {
              duration_scheduling = 0;
              course.sessions.map((session) => {
                duration_scheduling += parseInt(session.duration)
              })
            }

            let courseItemBase: IReportCourse = {
              _id: course?._id,
              courseName: course?.course?.name || '-',
              teacher: (course?.teacher?.profile) ? `${course?.teacher.profile?.first_name} ${course?.teacher.profile?.last_name}` : '-',
              startDate: course?.startDate ? moment(course.startDate).format('DD/MM/YYYY') : '-',
              endDate: course?.endDate ? moment(course.endDate).format('DD/MM/YYYY') : '-',
              courseCode: course?.course?.code || '-',
              duration: (duration_scheduling) ? generalUtility.getDurationFormated(duration_scheduling) : '0h',
            }

            itemBase.totalDuration += duration_scheduling || 0
            itemBase.courses.push(courseItemBase)
          }
        }

        if (itemBase.totalDuration) {
          itemBase.totalDurationFormated = (itemBase.totalDuration) ? generalUtility.getDurationFormated(itemBase.totalDuration) : '0h'
        }
        itemBase.totalCourses = itemBase.courses.length

        if (participantsByProgram[courseScheduling?._id.toString()]) {
          const participants = participantsByProgram[courseScheduling._id.toString()]
          let index = 1;
          for (const participant of participants) {
            let participantItemBase: IReportParticipant = {
              index,
              docNumber: participant?.user?.profile?.doc_number || '-',
              student: (participant?.user?.profile) ? `${participant?.user.profile?.first_name} ${participant?.user.profile?.last_name}` : '-',
              regional: courseScheduling?.regional?.name || '-',
              accountExecutive: (courseScheduling?.account_executive?.profile) ? `${courseScheduling?.account_executive?.profile.first_name} ${courseScheduling?.account_executive?.profile.last_name}` : '-',
              city: courseScheduling?.city?.name || '-',
              attendance: {
                attendanceByCourse: {},
                totalHoursAttended: 0,
                totalAttendancePercentage: 0
              },
              progress: {
                progressByCourse: {},
                percentageOfProgressInTheProgram: 0,
                forumNote: 0,
                taskNote: 0,
                evaluationNote: 0,
                finalNote: 0
              },
              certificationData: {
                isAuditorCerficateEnabled: false,
                firstCertificateIsAuditor: false,
                certificationLabel: undefined,
                virtualProgress: undefined,
                virtualActivities: undefined,
                assistance: undefined,
                auditorCertificate: {
                  certificationLabel: undefined,
                  auditorExamScore: undefined,
                },
                firstCertificateIsAuditorContent: {
                  auditorExamScore: undefined
                },
              },
              certification: {
                totalAssistanceCertification: '-',
                partialCertification: '-',
                virtualCertification: '-',
                virtualApprovedExamAuditor: '-',
                virtualCertificationType: '-',
                certificateReleaseDate: '-',
                personWhoReleasesCertificate: '-',
                auditorCertificationType: '-',
              },
              auditor: {
                examNote: 0,
                examApproval: '-',
              }
            }

            let courseSchedulingInfoByParticipant: ICourseSchedulingInfoByParticipant;

            if (
              participantsInformationByProgram &&
              participantsInformationByProgram[courseScheduling._id.toString()] &&
              participantsInformationByProgram[courseScheduling._id.toString()][participant?.user?._id.toString()]
            ) {
              courseSchedulingInfoByParticipant = participantsInformationByProgram[courseScheduling._id.toString()][participant?.user?._id.toString()]
            }

            if (courseSchedulingInfoByParticipant?.generalData?.certificationData?.isAuditorCerficateEnabled) {
              itemBase.isAuditor = true;
              itemBase.isAuditorCerficateEnabled = true;
            }
            if (courseSchedulingInfoByParticipant?.generalData?.certificationData?.firstCertificateIsAuditor) {
              itemBase.isAuditor = true;
              itemBase.firstCertificateIsAuditor = true
            }


            // if (itemBase.isAuditor) {
            //   // participantItemBase.auditor.examNote = Math.floor((Math.random() * (100-1)) +1);
            //   participantItemBase.auditor.examNote = courseSchedulingInfoByParticipant?.generalData?.auditExamScore || 0; // @INFO: Dato extraido del consolidado
            //   // participantItemBase.auditor.examApproval = courseSchedulingInfoByParticipant?.generalData?.isAuditExamApprove ? 'Si' : 'No' // @INFO: Dato extraido del consolidado
            //   participantItemBase.auditor.examApproval = participantItemBase.auditor.examNote >= 70 ? 'Si' : 'No'  // -- @INFO: Dato calculado

            //   // participantItemBase.certification.auditorCertificationType = 'No se certifica'
            //   participantItemBase.certification.auditorCertificationType = courseSchedulingInfoByParticipant?.generalData?.auditCertificateType || '-' // @INFO: Dato extraido del consolidado
            // }

            if (!itemBase.isVirtual) {
              if (courseSchedulingDetails && courseSchedulingDetails[courseScheduling._id.toString()]) {
                const courses = courseSchedulingDetails[courseScheduling._id.toString()]
                let totalHoursAttended = 0;
                let totalAssistanceCertification = []
                for (const course of courses) {
                  if (!participantItemBase.attendance.attendanceByCourse[course?._id.toString()]) {
                    let participantInfoByCourse: ICourseSchedulingInfoByParticipantAndCourse;
                     if (courseSchedulingInfoByParticipant?.courses && courseSchedulingInfoByParticipant.courses[course?._id.toString()]) {
                      participantInfoByCourse = courseSchedulingInfoByParticipant.courses[course?._id.toString()];
                     }
                    // const attendanceParticipantInCourse = Math.floor((Math.random() * (100-1)) +1)
                    const attendanceParticipantInCourse = participantInfoByCourse?.attendanceScore || 0 // @INFO: Dato extraido del consolidado
                    participantItemBase.attendance.attendanceByCourse[course?._id.toString()] = {
                      value: attendanceParticipantInCourse
                    }
                    totalHoursAttended += attendanceParticipantInCourse;
                    if (attendanceParticipantInCourse >= 75) {
                      totalAssistanceCertification.push(true)
                    } else {
                      totalAssistanceCertification.push(false)
                    }
                  }
                }
                const maximumTotalOfCourses = 100 * courses.length;
                const totalProgramDurationInHours = Math.trunc(itemBase.totalDuration / 3600)

                // participantItemBase.attendance.totalHoursAttended = courseSchedulingInfoByParticipant?.generalData?.totalAttendanceHours || 0 // @INFO:  Dato extraido del consolidado
                participantItemBase.attendance.totalHoursAttended = Math.round(((((totalHoursAttended) * 100)/(maximumTotalOfCourses))*(totalProgramDurationInHours))/100) // @INFO: Dato calculado

                // participantItemBase.attendance.totalAttendancePercentage = courseSchedulingInfoByParticipant?.generalData?.totalAttendanceScore || 0 // @INFO: Dato extraido del consolidado
                participantItemBase.attendance.totalAttendancePercentage = Math.round((((totalHoursAttended) * 100)/(maximumTotalOfCourses))) // @INFO: Dato calculado

                if (totalAssistanceCertification.length > 0) {
                  const anyFalse = totalAssistanceCertification.filter((i) => i === false)
                  // participantItemBase.certification.totalAssistanceCertification = courseSchedulingInfoByParticipant?.generalData?.isAttendanceCertification ? 'SI' : 'NO' // @INFO: Dato extraido del consolidado
                  participantItemBase.certification.totalAssistanceCertification = anyFalse ? 'NO' : 'SI' // @INFO: Dato calculado

                  // participantItemBase.certification.partialCertification =  courseSchedulingInfoByParticipant?.generalData?.isPartialCertification ? 'SI' : 'NO' // @INFO: Dato extraido del consolidado
                  participantItemBase.certification.partialCertification =  participantItemBase.certification.totalAssistanceCertification === 'SI' ? 'NO' : 'SI' // @INFO: Dato calculado
                }
              }
            } else {
              if (courseSchedulingDetails && courseSchedulingDetails[courseScheduling._id.toString()]) {
                const courses = courseSchedulingDetails[courseScheduling._id.toString()]
                let totalProgress = 0;
                for (const course of courses) {
                  if (!participantItemBase.progress.progressByCourse[course?._id.toString()]) {
                    // const progressParticipantInCourse = Math.floor((Math.random() * (100-1)) +1)

                    let participantInfoByCourse: ICourseSchedulingInfoByParticipantAndCourse;
                    if (courseSchedulingInfoByParticipant?.courses && courseSchedulingInfoByParticipant.courses[course?._id.toString()]) {
                      participantInfoByCourse = courseSchedulingInfoByParticipant.courses[course?._id.toString()];
                    }
                    const progressParticipantInCourse = participantInfoByCourse?.progressPercentage || 0 // @INFO: Dato extraido del consolidado
                    participantItemBase.progress.progressByCourse[course?._id.toString()] = {
                      value: progressParticipantInCourse
                    }
                    totalProgress += progressParticipantInCourse;
                  }
                }
                if (courses.length > 0) {
                  participantItemBase.progress.percentageOfProgressInTheProgram = Math.round(totalProgress / courses.length)
                }

                // participantItemBase.progress.forumNote = Math.floor((Math.random() * (100-1)) +1)
                participantItemBase.progress.forumNote = courseSchedulingInfoByParticipant?.generalData?.forumsScore || 0 // @INFO: Dato extraido del consolidado
                // participantItemBase.progress.taskNote = Math.floor((Math.random() * (100-1)) +1)
                // participantItemBase.progress.evaluationNote = Math.floor((Math.random() * (100-1)) +1)
                // participantItemBase.progress.finalNote = Math.floor((Math.random() * (100-1)) +1)
                participantItemBase.progress.taskNote = courseSchedulingInfoByParticipant?.generalData?.taskScore || 0 // @INFO: Dato extraido del consolidado
                participantItemBase.progress.evaluationNote = courseSchedulingInfoByParticipant?.generalData?.examsScore || 0 // @INFO: Dato extraido del consolidado
                participantItemBase.progress.finalNote = courseSchedulingInfoByParticipant?.generalData?.totalScore || 0 // @INFO: Dato extraido del consolidado


                // const certificationStatus = []
                // if (participantItemBase.progress.percentageOfProgressInTheProgram === 100) {
                //   certificationStatus.push(true)
                // } else {
                //   certificationStatus.push(false)
                // }

                // if (participantItemBase.progress.evaluationNote >= 70) {
                //   certificationStatus.push(true)
                // } else {
                //   certificationStatus.push(false)
                // }

                // if (itemBase.isAuditor) {
                //   if (participantItemBase.auditor.examNote >= 70) {
                //     certificationStatus.push(true)
                //   } else {
                //     certificationStatus.push(false)
                //   }
                // }
                // if (participant?.user?.profile?.doc_number === '1005848364') {
                //   console.log('participantItemBase.progress.percentageOfProgressInTheProgram', participantItemBase.progress.percentageOfProgressInTheProgram)
                //   console.log('participantItemBase.progress.evaluationNote', participantItemBase.progress.evaluationNote)
                //   console.log('participantItemBase.auditor.examNote', participantItemBase.auditor.examNote)
                //   console.log('certificationStatus', certificationStatus)
                // }

                // let virtualCertification = 'NO'
                // if (certificationStatus.length > 0) {
                //   const anyFalse = certificationStatus.filter((i) => i === false)
                //   if (!anyFalse) {
                //     virtualCertification = 'SI'
                //   }
                // }

                // participantItemBase.certification.virtualCertification = virtualCertification
                // participantItemBase.certification.virtualApprovedExamAuditor = itemBase.isAuditor && participantItemBase.auditor.examNote > 70 ? 'SI' : 'NO'
                // participantItemBase.certification.virtualCertificationType = `${virtualCertification} SE CERTIFICA`


              }
            }

            // @INFO: Items para certificación
            participantItemBase.certificationData.certificationLabel = courseSchedulingInfoByParticipant?.generalData?.certificationData?.certificationLabel || '-'
            if (courseSchedulingInfoByParticipant?.generalData?.certificationData?.isAuditorCerficateEnabled) {
              participantItemBase.certificationData.auditorCertificate.certificationLabel = courseSchedulingInfoByParticipant?.generalData?.certificationData?.auditorCertificate?.certificationLabel || '-'
              participantItemBase.certificationData.auditorCertificate.auditorExamScore = courseSchedulingInfoByParticipant?.generalData?.certificationData?.auditorCertificate?.auditorExamScore || 0
            } else if (courseSchedulingInfoByParticipant?.generalData?.certificationData?.firstCertificateIsAuditor) {
              participantItemBase.certificationData.auditorCertificate.auditorExamScore = courseSchedulingInfoByParticipant?.generalData?.certificationData?.firstCertificateIsAuditorContent?.auditorExamScore || 0
            }

            if (
              certificationsByProgram &&
              certificationsByProgram[courseScheduling._id.toString()] &&
              certificationsByProgram[courseScheduling._id.toString()][participant?.user?._id.toString()]
            ) {
              if (certificationsByProgram[courseScheduling._id.toString()][participant?.user?._id.toString()]['academic']) {
                const certification = certificationsByProgram[courseScheduling._id.toString()][participant?.user._id.toString()]['academic'];
                participantItemBase.certification.certificateReleaseDate = moment(certification?.created_at).format('YYYY-MM-DD')
                participantItemBase.certification.personWhoReleasesCertificate = (certification?.auxiliar?.profile) ? `${certification?.auxiliar.profile?.first_name} ${certification?.auxiliar.profile?.last_name}` : '-'
              }
            }
            itemBase.participants.push(participantItemBase)
            index++;
          }
        }

        reportDataPerPage.data = itemBase;
        report.pages.push(reportDataPerPage)
      }

      if (output_format === 'json') {
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          report
        }})
      } else if (output_format === 'xlsx') {
        if (report.pages.length === 0) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.factory.no_data' })

        const wb = await this.buildXLSX(report);
        if (!wb) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_build_xlsx' })

        // @INFO Se carga el archivo al servidor
        const send = await xlsxUtility.uploadXLSX({ from: 'file', attached: { file: { name: `${title}.xlsx` } } }, {workbook: wb})
        if (!send) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_upload_xlsx' })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            path: send,
          }
        })
      }

      return responseUtility.buildResponseSuccess('json')
    } catch (err) {
      console.log('reportByModalityService - generateReport', err)
      return responseUtility.buildResponseFailed('json')
    }
  }

  private buildXLSX = (report: IReportByModalityStructure) => {
    try {
      // @INFO: Inicializamos el nuevo libro de excel
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      for (const reportData of report.pages) {
        const wsSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])

        let row = 0;
        const merge = []
        const sheetData = []

        // @INFO: Encabezado inicial
        sheetData.push([`INFORMES DE OPERACIÓN - ${reportData?.data?.isAuditor ? 'FORMACIÓN DE AUDITORES' : 'NO AUDITORES'}`])
        sheetData.push([])
        let itemMerge = {}
        itemMerge['s'] = {r: row, c: 0}
        itemMerge['e'] = {r: row, c: 11}

        merge.push(itemMerge)
        row++;
        row++;

        if (reportData?.queryRange?.reportStartDate && reportData?.queryRange?.reportEndDate) {
          sheetData.push(['PERIODO DE CONSULTA', ''])
          sheetData.push(['Fecha 1', reportData?.queryRange?.reportStartDate])
          sheetData.push(['Fecha 2', reportData?.queryRange?.reportEndDate])
          sheetData.push([])

          let itemMergeFilterDate = {}
          itemMergeFilterDate['s'] = {r: row, c: 0}
          itemMergeFilterDate['e'] = {r: row, c: 1}
          merge.push(itemMergeFilterDate)
          row++;
          row++;
          row++;
          row++;
        }

        // @INFO: Información del servicio
        sheetData.push(['PROGRAMA DE FORMACIÓN', reportData?.data?.programName])
        row++
        sheetData.push(['CODIGO DEL PROGRAMA', reportData?.data?.programCode])
        row++
        sheetData.push(['ID DEL SERVICIO', reportData?.data?.serviceId])
        row++
        sheetData.push(['MODALIDAD', reportData?.data?.modalityName])
        row++
        if (reportData?.data?.typeCourse?.length) {
          sheetData.push(['TIPO DE CURSO', reportData?.data?.typeCourse])
          row++
        }
        sheetData.push(['REGIONAL', reportData?.data?.regional])
        row++
        sheetData.push(['CIUDAD', reportData?.data?.city])
        row++
        sheetData.push(['CLIENTE', reportData?.data?.companyName])
        row++
        sheetData.push(['EJECUTIVO DE CUENTA', reportData?.data?.accountExecutive])
        row++
        sheetData.push(['NOMBRE PERSONA QUE CONSULTA', reportData?.personWhoGeneratesReport])
        row++;
        sheetData.push(['FECHA DEL REPORTE', reportData?.reportDate])
        row++
        sheetData.push([])
        row++

        // @INFO: Información de los cursos del programa
        if (reportData?.data?.courses) {
          const headerCourseStructure = [
            {key: 'courseName', label: 'CURSOS DE FORMACIÓN'},
            {key: 'teacher', label: 'DOCENTE'},
            {key: 'startDate', label: 'FECHA INICIAL'},
            {key: 'endDate', label: 'FECHA FINAL'},
            {key: 'courseCode', label: 'CÓDIGO'},
            {key: 'duration', label: 'DURACIÓN / HORAS'}
          ]
          for (const header of headerCourseStructure) {
            const headerCourses = [header.label]
            for (const course of reportData?.data?.courses) {
              headerCourses.push(course[header.key])
            }
            sheetData.push(headerCourses)
            row++;
          }
          sheetData.push(['DURACIÓN TOTAL PROGRAMA', reportData?.data?.totalDurationFormated])
          let itemMerge = {}
          itemMerge['s'] = {r: row, c: 1}
          itemMerge['e'] = {r: row, c: reportData?.data?.courses.length}

          merge.push(itemMerge)
          row++;

          sheetData.push([])
          row++;
        }

        // @INFO: Información de los participantes
        if (reportData?.data?.participants) {
          const preHeaderParticipants = ['','','','','','']
          const headerParticipants = [
            'No',
            'IDENTIFICACIÓN',
            'NOMBRE Y APELLIDOS',
            'REGIONAL',
            'CIUDAD',
            'EJECUTIVO DE CUENTA'
          ]
          let colCount = 0
          let itemMerge = {}
          itemMerge['s'] = {r: row, c: colCount}
          colCount = headerParticipants.length - 1;
          itemMerge['e'] = {r: row, c: colCount}
          colCount++;
          merge.push(itemMerge)

          if (!reportData?.data?.isVirtual) {
            if (reportData?.data?.courses && reportData?.data?.courses.length > 0) {
              preHeaderParticipants.push('PORCENTAJE DE ASISTENCIA POR CURSO')
              let itemMerge = {}
              itemMerge['s'] = {r: row, c: colCount}
              for (const course of reportData?.data?.courses) {
                headerParticipants.push(`% ASISTENCIA - ${course?.courseName}`)
                colCount++;
              }
              for (let index = 0; index < reportData?.data?.courses.length-1; index++) {
                preHeaderParticipants.push("")
              }
              itemMerge['e'] = {r: row, c: (colCount - 1)}
              merge.push(itemMerge)
            }

            preHeaderParticipants.push('RESUMEN DE INFORMACIÓN ASISTENCIA Y NOTAS', '')
            let itemMerge = {}
            itemMerge['s'] = {r: row, c: colCount}
            headerParticipants.push(`HORAS ASISTIDAS TOTAL PROGRAMA`)
            colCount++;
            headerParticipants.push(`PORCENTAJE TOTAL DE ASISTENCIA`)
            colCount++;
            if (reportData?.data?.isAuditor) {
              headerParticipants.push(`NOTA EXAMEN DE AUDITORIA`)
              preHeaderParticipants.push('')
              colCount++;
              // headerParticipants.push(`APROBACIÓN EXAMEN DE AUDITORIA`)
              // preHeaderParticipants.push('')
              // colCount++;
            }
            itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(itemMerge)


            preHeaderParticipants.push(
              `CERTIFICACIÓN AL CURSO/PROGRAMA/DIPLOMADO ${reportData?.data?.isAuditor ? 'Y FORMACIÓN DE AUDITORES' : ''}`,
              ''
            )
            let _itemMerge = {}
            _itemMerge['s'] = {r: row, c: colCount}
            // headerParticipants.push(`Certificación total asistencia al Curso/Programa/Diplomado`)
            headerParticipants.push(`CERTIFICACIÓN AL CURSO/PROGRAMA/DIPLOMADO`)
            colCount++;
            // headerParticipants.push(`Certificación parcial al Curso/Programa/Diplomado`)
            // colCount++;
            if (reportData?.data?.isAuditor && reportData?.data?.isAuditorCerficateEnabled) {
              headerParticipants.push(`CERTIFICADO 2`)
              preHeaderParticipants.push('')
              colCount++;
            }
            _itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(_itemMerge)

            preHeaderParticipants.push(`VALIDACIÓN Y DESCARGA DE CERTIFICADOS`, '')
            let __itemMerge = {}
            __itemMerge['s'] = {r: row, c: colCount}
            headerParticipants.push(`Fecha de liberación de certificados`)
            colCount++;
            headerParticipants.push(`Auxiliar liberador`)
            colCount++;
            __itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(__itemMerge)
          } else {
            if (reportData?.data?.courses && reportData?.data?.courses.length > 0) {
              preHeaderParticipants.push('AVANCE DEL PROGRAMA')
              let itemMerge = {}
              itemMerge['s'] = {r: row, c: colCount}
              for (const course of reportData?.data?.courses) {
                headerParticipants.push(`${course?.courseName}`)
                colCount++;
              }
              for (let index = 0; index < reportData?.data?.courses.length-1; index++) {
                preHeaderParticipants.push("")
              }
              headerParticipants.push(`% DE AVANCE EN EL PROGRAMA`)
              preHeaderParticipants.push('')
              colCount++;
              headerParticipants.push(`NOTA FORO`)
              preHeaderParticipants.push('')
              colCount++;
              headerParticipants.push(`NOTA TAREAS`)
              preHeaderParticipants.push('')
              colCount++;
              headerParticipants.push(`NOTA TOTAL EVALUACIONES MODULO`)
              preHeaderParticipants.push('')
              colCount++;
              if (reportData?.data?.isAuditor) {
                headerParticipants.push(`NOTA EXAMEN AUDITORIA`)
                preHeaderParticipants.push('')
                colCount++;
              }
              headerParticipants.push(`NOTA FINAL`)
              preHeaderParticipants.push('')
              colCount++;

              itemMerge['e'] = {r: row, c: (colCount - 1)}
              merge.push(itemMerge)
            }

            preHeaderParticipants.push('CERTIFICACIÓN AL CURSO/PROGRAMA/DIPLOMADO')
            let itemMerge = {}
            itemMerge['s'] = {r: row, c: colCount}
            headerParticipants.push(`CERTIFICACIÓN AL CURSO/PROGRAMA/DIPLOMADO`)
            colCount++;
            // participantItemBase.certificationData.certificationLabel
            if (reportData?.data?.isAuditor && reportData?.data?.isAuditorCerficateEnabled) {
              headerParticipants.push(`CERTIFICACIÓN 2`)
              preHeaderParticipants.push('')
              colCount++;
              // headerParticipants.push(`TIPO DE CERTIFICADO DE FORMACIÓN DE AUDITORES`)
              // preHeaderParticipants.push('')
              // colCount++;
            }
            itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(itemMerge)

            preHeaderParticipants.push(`VALIDACIÓN Y DESCARGA DE CERTIFICADOS`, '')
            let __itemMerge = {}
            __itemMerge['s'] = {r: row, c: colCount}
            headerParticipants.push(`Fecha de liberación de certificados`)
            colCount++;
            headerParticipants.push(`Auxiliar liberador`)
            colCount++;
            __itemMerge['e'] = {r: row, c: (colCount - 1)}
            merge.push(__itemMerge)
          }

          if (preHeaderParticipants.length > 0) {
            sheetData.push(preHeaderParticipants)
          }
          if (headerParticipants.length > 0) {
            sheetData.push(headerParticipants)
          }

          for (const participant of reportData?.data?.participants) {
            const contentParticipants = [
              participant.index,
              participant.docNumber,
              participant.student,
              participant.regional,
              participant.city,
              participant.accountExecutive
            ]

            if (!reportData?.data?.isVirtual) {
              if (reportData?.data?.courses && reportData?.data?.courses.length > 0) {
                for (const course of reportData?.data?.courses) {
                  let value = 0
                  if (
                    participant?.attendance?.attendanceByCourse[course?._id.toString()]
                  ) {
                    value = participant?.attendance?.attendanceByCourse[course?._id.toString()].value
                  }
                  contentParticipants.push(`${value}%`)
                }
              }
              contentParticipants.push(participant?.attendance?.totalHoursAttended)
              contentParticipants.push(`${participant?.attendance?.totalAttendancePercentage}%`)

              if (reportData?.data?.isAuditor) {
                // contentParticipants.push(participant?.auditor?.examNote.toString())
                // contentParticipants.push(participant?.auditor?.examApproval)
                contentParticipants.push(participant?.certificationData?.auditorCertificate?.auditorExamScore)
              }

              // contentParticipants.push(participant?.certification?.totalAssistanceCertification)
              // contentParticipants.push(participant?.certification?.partialCertification)
              contentParticipants.push(participant?.certificationData?.certificationLabel)

              if (reportData?.data?.isAuditor && reportData?.data?.isAuditorCerficateEnabled) {
                // contentParticipants.push(participant?.certification?.auditorCertificationType)
                contentParticipants.push(participant?.certificationData?.auditorCertificate?.certificationLabel)
              }
              contentParticipants.push(participant?.certification?.certificateReleaseDate)
              contentParticipants.push(participant?.certification?.personWhoReleasesCertificate)
            } else {
              if (reportData?.data?.courses && reportData?.data?.courses.length > 0) {
                for (const course of reportData?.data?.courses) {
                  let value = 0
                  if (
                    participant?.progress?.progressByCourse[course?._id.toString()]
                  ) {
                    value = participant?.progress?.progressByCourse[course?._id.toString()].value
                  }
                  contentParticipants.push(`${value}%`)
                }
                contentParticipants.push(participant?.progress?.percentageOfProgressInTheProgram)
                contentParticipants.push(participant?.progress?.forumNote)
                contentParticipants.push(participant?.progress?.taskNote)
                contentParticipants.push(participant?.progress?.evaluationNote)

                if (reportData?.data?.isAuditor) {
                  // contentParticipants.push(participant?.auditor?.examNote)
                  contentParticipants.push(participant?.certificationData?.auditorCertificate?.auditorExamScore)
                }
                contentParticipants.push(participant?.progress?.finalNote)
              }

              // contentParticipants.push(participant?.certification?.virtualCertification)
              contentParticipants.push(participant?.certificationData?.certificationLabel)
              if (reportData?.data?.isAuditor && reportData?.data?.isAuditorCerficateEnabled) {
                contentParticipants.push(participant?.certificationData?.auditorCertificate?.certificationLabel)
                // contentParticipants.push(participant?.certification?.virtualCertificationType)
              }

              contentParticipants.push(participant?.certification?.certificateReleaseDate)
              contentParticipants.push(participant?.certification?.personWhoReleasesCertificate)
            }


            sheetData.push(contentParticipants)
          }
        }


        if (merge.length > 0) {
          wsSheet["!merges"] = merge;
        }

        const cols = []
        for (let index = 0; index < 40; index++) {
          cols.push({width: 35})
        }

        wsSheet["!cols"] = cols

        XLSX.utils.sheet_add_aoa(wsSheet, sheetData, {origin: "A1"});

          // @INFO Se agrega al workbook
        const newTitle = reportData.title.length > 31 ? reportData.title.substring(0, 31) : reportData.title
        XLSX.utils.book_append_sheet(wb, wsSheet, newTitle)
      }

      return wb
    } catch(err) {
      console.log('reportByModalityService - buildXLSX', err)
      return null;
    }
  }
}

export const reportByModalityService = new ReportByModalityService();
export { ReportByModalityService as DefaultDataReportsReportByModalityService };
