// @import_dependencies_node Import libraries
import * as XLSX from "xlsx";
const ObjectID = require('mongodb').ObjectID
import {decode} from 'html-entities';
import moment from "moment";
// @end

// @import services
import {academicResourceService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceService'
// @end

// @import utilities
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility'
import { responseUtility } from '@scnode_core/utilities/responseUtility';
import { generalUtility } from "@scnode_core/utilities/generalUtility";
// @end

// @import models
// @end

// @import types
import {
  IGenerateSurveyReport,
  IReportSurvey,
  ISectionQuestionsRange,
  ISectionQuestionsOpen,
  ISectionQuestionsChoiceSimple,
  IGeneralReportSurvey,
  IReportSurveyGeneralInfo,
  IConsolidateSurvey,
  IConsolidateSurveyQuestionRange,
  IConsolidateSurveyQuestionRangeQuestion,
  IConsolidateSurveyQuestionsWithOptions,
  IConsolidateSurveyQuestionsWithOptionsAnswer,
  IConsolidateSurveyIn,
} from '@scnode_app/types/default/data/academicContent/survey/surveyDataTypes'
import { AcademicResourceAttempt, ConsolidatedSurveyInformation, CourseScheduling, CourseSchedulingDetails, CourseSchedulingMode, CourseSchedulingStatus, Enrollment, Question, Survey, User } from '@scnode_app/models';
import { TypeCourse } from '@scnode_app/types/default/admin/course/courseSchedulingTypes';
// @end

class SurveyDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  public consolidateSurvey = async (params: IConsolidateSurveyIn) => {
    try {
      const output_format: any = params.output_format ? params.output_format : 'db'
      const surveyData: any = await this.generalSurveyReport({
        output_format: 'json',
      })
      const data = []
      if (surveyData?.status === 'success' && surveyData?.data) {
        const dataReport = surveyData?.data as IGeneralReportSurvey[]
        for (const reportData of dataReport) {
          for (const scheduling of reportData.scheduling) {
            const questionsRangeAverage = scheduling?.questionsRangeAverage || 0;
            const surveyBySchedulingItem: Partial<IConsolidateSurvey> = {
              courseScheduling: scheduling?.courseScheduling || undefined,
              courseSchedulingDetail: scheduling?.courseSchedulingDetail || undefined,
              endDate: scheduling?.endDate || undefined,
              endDateMonth: scheduling?.endDateMonth || undefined,
              endDateYear: scheduling?.endDateYear || undefined,
              isVirtual: reportData?.isVirtual || false,
              totalSurvey: scheduling?.totalSurvey || 0,
              teacher: scheduling?.teacherId || undefined,
              questionsRange: [],
              questionsRangeAverage: questionsRangeAverage,
              surveyPercentage: Math.round(((questionsRangeAverage * 100) / 5) * 100) / 100,
              questionsWithOptions: [],
            }
            if (scheduling?.questionsRange) {
              for (const questionsRange of scheduling.questionsRange) {
                const questionsRangeItem: IConsolidateSurveyQuestionRange = {
                  sectionId: questionsRange?._id || '-',
                  category: questionsRange?.category || undefined,
                  averageSection: questionsRange?.average || 0,
                  questions: []
                }
                if (questionsRange?.questions) {
                  for (const key in questionsRange?.questions) {
                    if (Object.prototype.hasOwnProperty.call(questionsRange?.questions, key)) {
                      const question = questionsRange?.questions[key];
                      const questionItem: IConsolidateSurveyQuestionRangeQuestion = {
                        questionId: question?._id || '-',
                        questionAverage: question?.average || 0,
                        totalAnswers: question?.total_answers || 0,
                        answers: {
                          totalPoints: question?.answers?.total || 0,
                          list: question?.answers?.list || []
                        }
                      }
                      questionsRangeItem.questions.push(questionItem)
                    }
                  }
                }
                surveyBySchedulingItem.questionsRange.push(questionsRangeItem)
              }
            }
            if (scheduling?.questionsWithOptions) {
              for (const key in scheduling?.questionsWithOptions) {
                if (Object.prototype.hasOwnProperty.call(scheduling?.questionsWithOptions, key)) {
                  const questionsWithOptions = scheduling?.questionsWithOptions[key];
                  const questionsWithOptionsItem: IConsolidateSurveyQuestionsWithOptions = {
                    questionId: questionsWithOptions?._id || '-',
                    answers: [],
                    totalAnswers: questionsWithOptions?.total_answers || 0,
                  }
                  if (questionsWithOptions?.answers) {
                    for (const _key in questionsWithOptions?.answers) {
                      if (Object.prototype.hasOwnProperty.call(questionsWithOptions?.answers, _key)) {
                        const answer = questionsWithOptions?.answers[_key];
                        const answerItem: IConsolidateSurveyQuestionsWithOptionsAnswer = {
                          unique: answer?.unique || '-',
                          totalAnswers: answer?.total_answers || 0,
                          averageQuestion: answer?.average || 0
                        }
                        questionsWithOptionsItem.answers.push(answerItem)
                      }
                    }
                  }
                  surveyBySchedulingItem.questionsWithOptions.push(questionsWithOptionsItem)
                }
              }
            }

            if (output_format === 'db') {
              const where = {}
              if (surveyBySchedulingItem?.courseScheduling) {
                where['courseScheduling'] = surveyBySchedulingItem?.courseScheduling
              }
              if (surveyBySchedulingItem?.courseSchedulingDetail) {
                where['courseSchedulingDetail'] = surveyBySchedulingItem?.courseSchedulingDetail
              }
              const exists: any = await ConsolidatedSurveyInformation.findOne(where).select('_id').lean()
              if (exists) {
                const updateData: any = await ConsolidatedSurveyInformation.findByIdAndUpdate(exists._id, surveyBySchedulingItem, {
                  useFindAndModify: false,
                  new: true,
                  lean: true,
                })
              } else {
                const createData: any = await ConsolidatedSurveyInformation.create(surveyBySchedulingItem)
              }
            }
            data.push(surveyBySchedulingItem)
          }
        }
      }

      if (output_format === 'json') {
        return responseUtility.buildResponseSuccess('json', null, {additional_parameters: {
          data
        }})
      }
      return responseUtility.buildResponseSuccess('json', null)
    } catch (err) {
      console.log('SurveyDataService --- consolidateSurvey', err)
      return responseUtility.buildResponseFailed('json')
    }
  }

  public generalSurveyReport = async (params: any) => {
    try {

      const time = new Date().getTime()

      // @INFO: Se define el formato del reporte, xlsx por defecto
      const output_format: any = params.output_format ? params.output_format : 'xlsx'
      const title: any = params.title ? params.title : `reporte_satisfaccion_${time}`

      const reportStartDate = params.startDate || undefined
      const reportEndDate = params.endDate || undefined
      const statusQuery = params.status || 'enabled'

      // @INFO: Consultando encuestas programadas
      const courseSchedulingModes = await CourseSchedulingMode.find({moodle_id: {$exists: true}}).select('id name')
      if (!courseSchedulingModes) return responseUtility.buildResponseFailed('json')

      const courseSchedulingModesInfoById = courseSchedulingModes.reduce((accum, element) => {
        if (!accum[element._id]) {
          accum[element._id] = element;
        }
        return accum
      }, {})
      // const courseSchedulingModesInfoByName = courseSchedulingModes.reduce((accum, element) => {
      //   if (!accum[element.name]) {
      //     accum[element.name] = element;
      //   }
      //   return accum
      // }, {})
      const courseSchedulingModesIds = courseSchedulingModes.reduce((accum, element) => {
        accum.push(ObjectID(element._id))
        return accum
      }, [])

      const courseSchedulingStatus = await CourseSchedulingStatus.find().select('id name')
      if (!courseSchedulingStatus) return responseUtility.buildResponseFailed('json')

      const courseSchedulingStatusInfo = courseSchedulingStatus.reduce((accum, element) => {
        if (!accum[element.name]) {
          accum[element.name] = element;
        }
        return accum
      }, {})

      let matchCourseModes = {
        'config.content.config.course_modes': {$in: courseSchedulingModesIds},
        'deleted': false,
      }
      if (['enabled', 'disabled'].includes(statusQuery))  {
        matchCourseModes['status'] = statusQuery
      }

      const aggregateQuery = [
        {
          $lookup: {
            from: 'academic_resource_configs',
            localField: 'config.content',
            foreignField: '_id',
            as: 'config.content'
          }
        },
        { $unwind: '$config.content' },
        {
          $lookup: {
            from: 'academic_resources',
            localField: 'config.content.academic_resource',
            foreignField: '_id',
            as: 'config.content.academic_resource'
          }
        },
        { $unwind: '$config.content.academic_resource' },
        {
          $match: matchCourseModes
        },
        {
          $group: {
            _id: '$_id',
            survey: { "$first": '$_id'},
            academic_resource_config: {$first: '$config.content'}
          }
        }
      ]

      const surveyData = await Survey.aggregate(aggregateQuery)

      let reportData: IGeneralReportSurvey[] = []
      console.time('Init')

      for (const survey of surveyData) {
        if (survey?.academic_resource_config?.config?.course_modes && courseSchedulingModesInfoById[survey?.academic_resource_config?.config?.course_modes]) {
          console.time(`Survey ${survey._id}`)
          const modality = courseSchedulingModesInfoById[survey?.academic_resource_config?.config?.course_modes]

          let questions = []
          if (
            survey.academic_resource_config &&
            survey.academic_resource_config.academic_resource &&
            survey.academic_resource_config.academic_resource.config &&
            survey.academic_resource_config.academic_resource.config.questions
          ) {
            questions = survey.academic_resource_config.academic_resource.config.questions
          }

          if (questions.length === 0) return responseUtility.buildResponseFailed('json', null, {error_key: 'survey.report.questions_not_found'})

          const questionException = [
            '6154e630dc0dee747875b0c2'
          ]

          const question_ids = questions.reduce((acumm, element) => {
            if (!questionException.includes(element.question.toString())) {
              acumm.push(element.question)
            }
            return acumm
          }, [])



          const questionMongo = await Question.find({_id: {$in: question_ids}})
          .populate({path: 'question_category', select: 'id name description config'})

          const questionMongo_byIds = questionMongo.reduce((acumm, element) => {
            acumm[element._id] = element
            return acumm
          }, {})

          for (const question of questions) {
            if (questionMongo_byIds[question.question]) {
              question.question = questionMongo_byIds[question.question]
            } else {
              delete question.question
            }
          }

          questions = await academicResourceService.mergeContainerQuestions(questions)

          const question_by_category = {}
          const reportQuestions = {}
          const section_questions_range: ISectionQuestionsRange[] = []
          const section_questions_open: Record<string, ISectionQuestionsOpen> = {}
          const section_questions_choice_simple:  Record<string, ISectionQuestionsChoiceSimple> = {}
          for (const question of questions) {
            if (question?.question?._id) {
              let item_questions_range: ISectionQuestionsRange = {
                _id: question.question._id,
                title: this.htmlEntitiesToUTF(question.question.content),
                questions: {},
                average: 0,
                category: question?.question?.config?.category || undefined
              }
              if (question.childs) {
                for (const child of question.childs) {
                  if (!question_by_category[child.question._id]) {
                    question_by_category[child.question._id] = child.question.question_category.name
                  }
                  if (child.question.question_category.name === 'select-range') {
                    if (!item_questions_range.questions[child.question._id]) {
                      item_questions_range.questions[child.question._id] = {
                        _id: child.question._id,
                        title: this.htmlEntitiesToUTF(child.question.content),
                        average: 0,
                        total_answers: 0,
                        answers: {
                          total: 0,
                          list: []
                        }
                      }
                      reportQuestions[child.question._id] = item_questions_range.questions[child.question._id]
                    }
                  } else if (child.question.question_category.name === 'open-answer') {
                    if (!section_questions_open[child.question._id]) {
                      section_questions_open[child.question._id] = {
                        _id: child.question._id,
                        title: this.htmlEntitiesToUTF(child.question.content),
                        answers: []
                      }
                    }
                  } else if (child.question.question_category.name === 'multiple-choice-unique-answer') {
                    if (!section_questions_choice_simple[child.question._id]) {
                      const _item_multiple: ISectionQuestionsChoiceSimple = {
                        _id: child.question._id,
                        title: this.htmlEntitiesToUTF(child.question.content),
                        answers: {},
                        total_answers: 0,
                        average: 0,
                      }

                      if (child.question.answers) {
                        for (const _ans of child.question.answers) {
                          if (!_item_multiple['answers'][_ans.unique]) {
                            _item_multiple['answers'][_ans.unique] = {
                              unique: _ans.unique,
                              title: this.htmlEntitiesToUTF(_ans.content),
                              total_answers: 0,
                              average: 0,
                            }
                          }
                        }
                      }
                      // reportQuestions[child.question._id] = {..._item_multiple, hasOptions: true}
                      reportQuestions[child.question._id] = _item_multiple
                      section_questions_choice_simple[child.question._id] = _item_multiple
                    }
                  }
                }
              }
              if (Object.keys(item_questions_range.questions).length > 0) {
                section_questions_range.push(item_questions_range)
              }
            }
          }
          if (modality.name === 'Presencial - En linea') {
            // if (courseSchedulingModesInfoByName['Presencial']) {
            //   let report: any = {
            //     title: courseSchedulingModesInfoByName['Presencial'].name,
            //     queryRange: {
            //       reportStartDate,
            //       reportEndDate
            //     },
            //     scheduling: [],
            //     questionsRange: section_questions_range.map((i) => i),
            //     questionsWithOptions: JSON.parse(JSON.stringify(section_questions_choice_simple)),
            //     totalSurvey: 0,
            //     isVirtual: false
            //   }
            //   report.scheduling = await this.getSchedulingsByModality(courseSchedulingModesInfoByName['Presencial'], courseSchedulingStatusInfo, {reportStartDate, reportEndDate})
            //   reportData.push(report)
            // }

            // if (courseSchedulingModesInfoByName['En linea']) {
            //   let report: any = {
            //     title: courseSchedulingModesInfoByName['En linea'].name,
            //     queryRange: {
            //       reportStartDate,
            //       reportEndDate
            //     },
            //     scheduling: [],
            //     questionsRange: section_questions_range.map((i) => i),
            //     questionsWithOptions: JSON.parse(JSON.stringify(section_questions_choice_simple)),
            //     totalSurvey: 0,
            //     isVirtual: false
            //   }
            //   report.scheduling = await this.getSchedulingsByModality(courseSchedulingModesInfoByName['En linea'], courseSchedulingStatusInfo, {reportStartDate, reportEndDate})
            //   reportData.push(report)
            // }
          } else if (['En linea', 'Presencial'].includes(modality.name)) {
            let report: any = {
              title: modality.name,
              queryRange: {
                reportStartDate,
                reportEndDate
              },
              scheduling: [],
              questionsRange: section_questions_range.map((i) => i),
              questionsWithOptions: JSON.parse(JSON.stringify(section_questions_choice_simple)),
              totalSurvey: 0,
              isVirtual: false
            }
            console.time('getSchedulingsByModality')
            report.scheduling = await this.getSchedulingsByModality(modality, courseSchedulingStatusInfo, {reportStartDate, reportEndDate})
            console.timeEnd('getSchedulingsByModality')
            console.time('getSurveyDataByScheduligs')
            report.scheduling = await this.getSurveyDataByScheduligs(report.scheduling, {
              questionByCategory: question_by_category,
              questionsRange: report.questionsRange,
              questionsWithOptions: report.questionsWithOptions
            })
            console.timeEnd('getSurveyDataByScheduligs')
            reportData.push(report)
          } else {
            const surveyCourseType = survey?.academic_resource_config?.config?.course_type
            const courseTypeTranslation = {
              [TypeCourse.FREE]: 'Gratuito',
              [TypeCourse.MOOC]: 'Mooc'
            }
            let report: any = {
              title: surveyCourseType?.length ? `${modality.name} - ${courseTypeTranslation[surveyCourseType]}` : modality.name,
              queryRange: {
                reportStartDate,
                reportEndDate
              },
              scheduling: [],
              questionsRange: JSON.parse(JSON.stringify(section_questions_range)),
              questionsWithOptions: JSON.parse(JSON.stringify(section_questions_choice_simple)),
              totalSurvey: 0,
              isVirtual: true
            }
            console.time('getSchedulingsByModality')
            report.scheduling = await this.getSchedulingsByModality(modality, courseSchedulingStatusInfo, {reportStartDate, reportEndDate, courseType: surveyCourseType})
            console.timeEnd('getSchedulingsByModality')
            console.time('getSurveyDataByScheduligs')
            report.scheduling = await this.getSurveyDataByScheduligs(report.scheduling, {
              questionByCategory: question_by_category,
              questionsRange: report.questionsRange,
              questionsWithOptions: report.questionsWithOptions
            })
            console.timeEnd('getSurveyDataByScheduligs')
            reportData.push(report)
          }
          console.timeEnd(`Survey ${survey._id}`)
          console.log('-------------------------------------------------')
        }
      }
      console.timeEnd('Init')

      if (output_format === 'xlsx') {
        if (reportData.length === 0) {
          return responseUtility.buildResponseFailed('json', null, { error_key: {key: 'reports.customReport.no_data', params: {
            customMessage: ' Las encuestas debe estar activas y tener preguntas configuradas para que se pueda generar el reporte'
          }} })
        }
        // @INFO: Generación de reporte excel
        const wb = await this.buildGeneralSurveyReportXLSX(reportData, title)
        if (!wb) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_build_xlsx' })

        // @INFO Se carga el archivo al servidor
        const send = await xlsxUtility.uploadXLSX({ from: 'file', attached: { file: { name: `${title}.xlsx` } } }, {workbook: wb})
        if (!send) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_upload_xlsx' })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            path: send,
          }
        })
      } else {
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            data: reportData,
          }
        })
      }
    } catch (e) {
      console.log('generalSurveyReport-error', e)
      return responseUtility.buildResponseFailed('json', null, {message: e?.message || 'Se ha presentado un error generando el reporte'})
    }
  }

  private getSchedulingsByModality = async (modality, courseSchedulingStatusInfo, options: {reportStartDate: string | undefined, reportEndDate: string | undefined, courseType?: string}) => {
    const schedulings = []
    let where: any = {
      schedulingMode: ObjectID(modality._id),
      typeCourse: options?.courseType?.length ? options.courseType : { $nin: [TypeCourse.FREE, TypeCourse.MOOC] },
      schedulingStatus: {$in: [
        ObjectID(courseSchedulingStatusInfo['Confirmado']._id),
        ObjectID(courseSchedulingStatusInfo['Ejecutado']._id),
        // courseSchedulingStatusInfo['Cancelado']._id,
      ]}
    }

    if (options?.reportStartDate && options?.reportEndDate) {
      where['startDate'] = {$gte: new Date(`${options.reportStartDate}T00:00:00Z`), $lte: new Date(`${options.reportEndDate}T23:59:59Z`)}
    }
    console.time(`GetSchedulingsByModality: ${modality._id}`)
    const aggregationPipeline = [
      {
        $match: where // Aplica el filtro `where` tal como lo harías en el método `find`
      },
      {
        $lookup: {
          from: 'course_scheduling_modes',
          localField: 'schedulingMode',
          foreignField: '_id',
          as: 'schedulingMode'
        }
      },
      { $unwind: '$schedulingMode' },
      {
        $lookup: {
          from: 'modulars',
          localField: 'modular',
          foreignField: '_id',
          as: 'modular'
        }
      },
      { $unwind: '$modular' },
      {
        $lookup: {
          from: 'programs',
          localField: 'program',
          foreignField: '_id',
          as: 'program'
        }
      },
      { $unwind: '$program' },
      {
        $lookup: {
          from: 'companies',
          localField: 'client',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $lookup: {
          from: 'cities',
          localField: 'city',
          foreignField: '_id',
          as: 'city'
        }
      },
      { $unwind: '$city' },
      {
        $lookup: {
          from: 'course_scheduling_types',
          localField: 'schedulingType',
          foreignField: '_id',
          as: 'schedulingType'
        }
      },
      { $unwind: '$schedulingType' },
      {
        $lookup: {
          from: 'regionals',
          localField: 'regional',
          foreignField: '_id',
          as: 'regional'
        }
      },
      { $unwind: '$regional' },
      {
        $lookup: {
          from: 'users',
          localField: 'account_executive',
          foreignField: '_id',
          as: 'account_executive'
        }
      },
      { $unwind: '$account_executive' },
      {
        $project: {
          _id: 1,
          metadata: 1,
          schedulingMode: { _id: 1, name: 1 },
          modular: { _id: 1, name: 1 },
          program: { _id: 1, name: 1, code: 1 },
          client: { _id: 1, name: 1 },
          city: { _id: 1, name: 1 },
          schedulingType: { id: 1, name: 1 },
          regional: { id: 1, name: 1 },
          account_executive: {
            _id: 1,
            'profile.first_name': 1,
            'profile.last_name': 1
          },
          startDate: 1,
          endDate: 1,
          duration: 1
        }
      }
    ];

    const courseSchedulings = await CourseScheduling.aggregate(aggregationPipeline);
    console.timeEnd(`GetSchedulingsByModality: ${modality._id}`)
    const courseSchedulingIds = courseSchedulings.reduce((accum, element) => {
      accum.push(ObjectID(element._id))
      return accum
    }, [])

    let courseSchedulingDetails = undefined;

    // if (['Presencial - En linea', 'Presencial', 'En linea', 'En Línea'].includes(modality.name)) {
      if (courseSchedulingIds.length > 0) {
        console.time('CourseSchedulingDetails')
        const aggregationPipeline = [
          {
            $match: {
              course_scheduling: { $in: courseSchedulingIds }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'teacher',
              foreignField: '_id',
              as: 'teacher'
            }
          },
          { $unwind: '$teacher' },
          {
            $lookup: {
              from: 'course_scheduling_sections',
              localField: 'course',
              foreignField: '_id',
              as: 'course'
            }
          },
          { $unwind: '$course' },
          {
            $project: {
              id: 1,
              course_scheduling: 1,
              teacher: {
                _id: 1,
                'profile.first_name': 1,
                'profile.last_name': 1
              },
              course: {
                _id: 1,
                name: 1,
                code: 1
              },
              startDate: 1,
              endDate: 1,
              duration: 1,
              sessions: 1
            }
          }
        ];

        const details = await CourseSchedulingDetails.aggregate(aggregationPipeline)
        console.timeEnd('CourseSchedulingDetails')

        courseSchedulingDetails = {};
        courseSchedulingDetails = details.reduce((accum, element) => {
          const course_scheduling = element?.course_scheduling?.toString()
          if (course_scheduling) {
            (accum[course_scheduling] ??= []).push(element)
          }
          return accum
        }, {})
      }
    // }

    let participantsByProgram = {}

    if (courseSchedulingIds.length > 0) {
      console.time('GetEnrollments')
      const enrolledByProgramQuery = await Enrollment.aggregate([
        {
          $match: {
            course_scheduling: {
              $in: courseSchedulingIds.reduce((accum, element) => {
                accum.push(ObjectID(element))
                return accum
              },[])
            }
          }
        },
        {
          $group: { _id: "$course_scheduling", count: { $sum: 1} }
        }
      ])
      console.timeEnd('GetEnrollments')
      if (enrolledByProgramQuery.length > 0) {
        participantsByProgram = enrolledByProgramQuery.reduce((accum, element) => {
          if (!accum[element._id.toString()]) {
            accum[element._id.toString()] = element.count;
          }
          return accum
        }, {})
      }
    }
    console.time('IterationCourseScheduling')
    for (const courseScheduling of courseSchedulings) {
      const itemBase = {
        _id: courseScheduling._id,
        courseScheduling: courseScheduling._id,
        courseSchedulingDetail: undefined,
        rowIndex: courseScheduling?.metadata?.service_id || '-',
        modular: courseScheduling?.modular?.name || '-',
        programCode: courseScheduling?.program?.code || '-',
        programName: courseScheduling?.program?.name || '-',
        startDate: courseScheduling?.startDate ? moment(courseScheduling.startDate).format('DD/MM/YYYY') : '-',
        startDateMonth: courseScheduling?.startDate ? moment(courseScheduling.startDate).format('MM') : '-',
        startDateYear: courseScheduling?.startDate ? moment(courseScheduling.startDate).format('YYYY') : '-',
        endDate: courseScheduling?.endDate ? moment(courseScheduling.endDate).format('YYYY-MM-DD') : '-',
        endDateMonth: courseScheduling?.endDate ? moment(courseScheduling.endDate).format('MM') : '-',
        endDateYear: courseScheduling?.endDate ? moment(courseScheduling.endDate).format('YYYY') : '-',
        duration: (courseScheduling?.duration) ? generalUtility.getDurationFormated(courseScheduling?.duration) : '0h',
        participants: (participantsByProgram[courseScheduling?._id]) ? participantsByProgram[courseScheduling._id] : 0,
        companyName: courseScheduling?.client?.name || '-',
        city: courseScheduling?.city?.name || '-',
        schedulingType: courseScheduling?.schedulingType?.name || '-',
        regional: courseScheduling?.regional?.name || '-',
        accountExecutive: (courseScheduling?.account_executive?.profile) ? `${courseScheduling?.account_executive?.profile.first_name} ${courseScheduling?.account_executive?.profile.last_name}` : '-',
        questionsRange: [],
        questionsRangeAverage: 0,
        questionsWithOptions: {}
      }
      if (['Presencial - En linea', 'Presencial', 'En linea', 'En Línea'].includes(courseScheduling.schedulingMode.name)) {
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
            let schedulingItem: any = JSON.parse(JSON.stringify(itemBase));
            schedulingItem._id = course._id;
            schedulingItem.courseSchedulingDetail = course._id;
            schedulingItem.teacherId = (course?.teacher) ? course?.teacher._id : undefined;
            schedulingItem.teacher = (course?.teacher?.profile) ? `${course?.teacher.profile?.first_name} ${course?.teacher.profile?.last_name}` : '-';
            schedulingItem.courseCode = course?.course?.code || '-';
            schedulingItem.courseName = course?.course?.name || '-';
            schedulingItem.startDate = course?.startDate ? moment(course.startDate).format('DD/MM/YYYY') : '-';
            schedulingItem.startDateMonth = course?.startDate ? moment(course.startDate).format('MM') : '-';
            schedulingItem.startDateYear = course?.startDate ? moment(course.startDate).format('YYYY') : '-';
            schedulingItem.endDate = course?.endDate ? moment(course.endDate).format('YYYY-MM-DD') : '-';
            schedulingItem.endDateMonth = course?.endDate ? moment(course.endDate).format('MM') : '-';
            schedulingItem.endDateYear = course?.endDate ? moment(course.endDate).format('YYYY') : '-'
            schedulingItem.duration = (duration_scheduling) ? generalUtility.getDurationFormated(duration_scheduling) : '0h';

            schedulings.push(schedulingItem)
          }
        }
      } else if (courseScheduling.schedulingMode.name === 'Virtual') {
        if (courseSchedulingDetails && courseSchedulingDetails[courseScheduling._id.toString()]) {
          const courses = courseSchedulingDetails[courseScheduling._id.toString()]
          const lastCourse = courses[courses.length - 1];
          let schedulingItem: any = JSON.parse(JSON.stringify(itemBase));
          schedulingItem.teacherId = (lastCourse?.teacher) ? lastCourse?.teacher._id : undefined;
          schedulingItem.teacher = (lastCourse?.teacher?.profile) ? `${lastCourse?.teacher.profile?.first_name} ${lastCourse?.teacher.profile?.last_name}` : '-';
          schedulings.push(schedulingItem)
        }
      }
    }
    console.timeEnd('IterationCourseScheduling')

    return schedulings;
  }

  private getSurveyDataByScheduligs = async (schedulings, options: {questionByCategory: any, questionsRange: any[], questionsWithOptions: any}) => {
    console.time('getIds')
    const getIds = schedulings.reduce((accum, element) => {
      accum.push(element._id.toString())
      return accum;
    }, [])
    console.timeEnd('getIds')

    if (getIds.length > 0) {
      // @INFO: Consultando los resultados de los usuarios
      console.time('AcademicResourceAttempt')
      const aggregationPipeline = [
        {
          $match: {
            'results.surveyRelated': { $in: getIds },
            'results.status': 'ended',
            'deleted': false
          }
        },
        {
          $project: {
            "results.statistics": 1,
            "results.surveyRelated": 1
          }
        }
      ];

      const academicResourceAttemps = await AcademicResourceAttempt.aggregate(aggregationPipeline);
      console.timeEnd('AcademicResourceAttempt')
      console.time('AcademicResourceAttemptReduce')
      const academicResourceAttempsGrouped = academicResourceAttemps.reduce((accum, element) => {
        const surveyRelated = element?.results?.surveyRelated;
        if (surveyRelated) {
          (accum[surveyRelated] ??= []).push(element);
        }
        return accum;
      }, {})
      console.timeEnd('AcademicResourceAttemptReduce')
      // console.log('academicResourceAttempsGrouped', academicResourceAttempsGrouped)

      console.time('Iterationschedulings2')
      for (const scheduling of schedulings) {

        scheduling.questionsRange = JSON.parse(JSON.stringify(options.questionsRange))
        scheduling.questionsWithOptions = JSON.parse(JSON.stringify(options.questionsWithOptions))
        scheduling.totalSurvey = (academicResourceAttempsGrouped[scheduling._id]) ? academicResourceAttempsGrouped[scheduling._id].length : 0
        if (academicResourceAttempsGrouped[scheduling._id]) {
          const schedulingQuestionsRange = scheduling.questionsRange;
          const schedulingQuestionsWithOptions = scheduling.questionsWithOptions;
          const questionByCategory = options.questionByCategory;

          for (const userAttemp of academicResourceAttempsGrouped[scheduling._id]) {
            const statistics = userAttemp.results?.statistics;
            if (Array.isArray(statistics)) {
              for (const result of statistics) {
                const question = result.question.toString();
                const category = questionByCategory[question] || null;

                switch (category) {
                  case 'select-range':
                    for (const section of schedulingQuestionsRange) {
                      const sectionQuestion = section.questions[question];
                      if (sectionQuestion) {
                        sectionQuestion.total_answers += 1;
                        sectionQuestion.answers.list.push(result.answer);
                        sectionQuestion.answers.total += parseInt(result.answer, 10);
                      }
                    }
                    break;

                  case 'multiple-choice-unique-answer':
                    const questionOptions = schedulingQuestionsWithOptions[question];
                    if (questionOptions && questionOptions.answers[result.answer]) {
                      questionOptions.answers[result.answer].total_answers += 1;
                      questionOptions.total_answers += 1;
                    }
                    break;
                }
              }
            }
          }
        }

        let averageQuestionsRange = 0

        for (const section of scheduling.questionsRange) {
          const amountQuestionsBySection = Object.keys(section.questions).length
          let averageTotal = 0
          for (const key in section.questions) {
            if (Object.prototype.hasOwnProperty.call(section.questions, key)) {
              const question = section.questions[key];
              const average = Math.round(((question.answers.total / question.total_answers)) * 100) / 100
              question.average = average
              averageTotal += average;
            }
          }
          section.average = Math.round(((averageTotal / amountQuestionsBySection)) * 100) / 100
          averageQuestionsRange += section.average
        }

        scheduling.questionsRangeAverage = Math.round(((averageQuestionsRange / scheduling.questionsRange.length)) * 100) / 100

        if (academicResourceAttempsGrouped[scheduling._id]) {
          for (const key in scheduling.questionsWithOptions) {
            if (Object.prototype.hasOwnProperty.call(scheduling.questionsWithOptions, key)) {
              const question = scheduling.questionsWithOptions[key];
              for (const _key in question.answers) {
                if (Object.prototype.hasOwnProperty.call(question.answers, _key)) {
                  const answer = question.answers[_key];
                  scheduling.questionsWithOptions[key].answers[_key].average = Math.round(((answer.total_answers * 100) / question.total_answers))
                }
              }
            }
          }
        }
      }
      console.timeEnd('Iterationschedulings2')

    }


    return schedulings;
  }

  /**
   * Metodo que permite generar un archivo XLSX
   * @param data
   * @returns
   */
   private buildGeneralSurveyReportXLSX = async (data: IGeneralReportSurvey[], title: string) => {

    try {
      // @INFO: Inicializamos el nuevo libro de excel
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      for (const report of data) {
        const wsSheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])

        let row = 0;
        let countCol = 0
        const merge = []
        const headerRange = []
        const headerTop = []
        const headerMain = []
        const sheetData = []

        if (report?.queryRange?.reportStartDate && report?.queryRange?.reportEndDate) {
          sheetData.push(['PERIODO DE CONSULTA', ''])
          sheetData.push(['Fecha 1', report?.queryRange?.reportStartDate])
          sheetData.push(['Fecha 2', report?.queryRange?.reportEndDate])
          sheetData.push([])

          let itemMerge = {}
          itemMerge['s'] = {r: row, c: 0}
          itemMerge['e'] = {r: row, c: 1}
          merge.push(itemMerge)
          row++;
          row++;
          row++;
          row++;
        }

        headerMain.push('Identificador servicio')
        headerMain.push('Docente')
        headerMain.push('Modular')
        headerMain.push('Código del programa')
        headerMain.push('Programa')
        if (!report.isVirtual) headerMain.push('Código del curso')
        if (!report.isVirtual) headerMain.push('Curso')
        headerMain.push('Fecha inicio')
        headerMain.push('Fecha finalizacion')
        headerMain.push('Duración')
        headerMain.push('Participantes')
        headerMain.push('Empresa')
        headerMain.push('Ciudad')
        headerMain.push('Tipo de servicio')
        headerMain.push('Regional')
        headerMain.push('Ejecutivo')
        headerMain.push('Mes')

        const body = []
        countCol = headerMain.length

        for (const section of report.questionsRange) {
          for (const questionId in section.questions) {
            if (Object.prototype.hasOwnProperty.call(section.questions, questionId)) {
              const question = section.questions[questionId];
              headerMain.push(question.title)
              countCol++;
            }
          }
        }
        for (const section of report.questionsRange) {
          headerMain.push(section.title)
          countCol++;
        }
        headerMain.push('Promedio del curso')
        countCol++;

        for (let index = 0; index < headerMain.length; index++) {
          headerTop.push("")
        }

        for (const questionId in report.questionsWithOptions) {
          if (Object.prototype.hasOwnProperty.call(report.questionsWithOptions, questionId)) {
            let itemMerge = {}
            const question = report.questionsWithOptions[questionId];
            headerTop.push(question.title)
            itemMerge['s'] = {r: row, c: countCol}

            for (const answerId in question.answers) {
              if (Object.prototype.hasOwnProperty.call(question.answers, answerId)) {
                const answer = question.answers[answerId];
                headerMain.push(answer.title)
                countCol++;
              }
            }
            for (let index = 0; index < Object.keys(question.answers).length-1; index++) {
              headerTop.push("")
            }
            itemMerge['e'] = {r: row, c: countCol-1}

            if (Object.keys(itemMerge).length > 0) {
              merge.push(itemMerge)
            }
          }
        }
        headerMain.push('Numero de encuestas')
        headerMain.push('Año')
        headerMain.push('PROMEDIO GENERAL')
        // console.log('headerMain', headerMain)


        if (headerRange.length > 0) {
          sheetData.push(headerRange)
        }
        sheetData.push(headerTop)
        row++
        sheetData.push(headerMain)
        row++

        // countCol = 0;

        for (const scheduling of report.scheduling) {
          let item = []
          item.push(scheduling.rowIndex);
          item.push(scheduling.teacher || '-');
          item.push(scheduling.modular);
          item.push(scheduling.programCode);
          item.push(scheduling.programName);
          if (!report.isVirtual) item.push(scheduling.courseCode);
          if (!report.isVirtual) item.push(scheduling.courseName);
          item.push(scheduling.startDate);
          item.push(scheduling.endDate);
          item.push(scheduling.duration);
          item.push(scheduling.participants);
          item.push(scheduling.companyName);
          item.push(scheduling.city);
          item.push(scheduling.schedulingType);
          item.push(scheduling.regional);
          item.push(scheduling.accountExecutive);
          item.push(scheduling.startDateMonth);

          for (const section of scheduling.questionsRange) {
            for (const questionId in section.questions) {
              if (Object.prototype.hasOwnProperty.call(section.questions, questionId)) {
                const question = section.questions[questionId];
                item.push(question.average || '-');
              }
            }
          }
          for (const section of scheduling.questionsRange) {
            item.push(section.average || '-');
          }
          item.push(scheduling.questionsRangeAverage || '-')
          for (const questionId in scheduling.questionsWithOptions) {
            if (Object.prototype.hasOwnProperty.call(scheduling.questionsWithOptions, questionId)) {
              const question = scheduling.questionsWithOptions[questionId];
              for (const answerId in question.answers) {
                if (Object.prototype.hasOwnProperty.call(question.answers, answerId)) {
                  const answer = question.answers[answerId];
                  item.push(answer.average ? `${answer.average}%` : '-');
                }
              }
            }
          }
          item.push(scheduling.totalSurvey);
          item.push(scheduling.startDateYear);
          item.push(scheduling.questionsRangeAverage || '-')

          sheetData.push(item)
        }

        if (merge.length > 0) {
          wsSheet["!merges"] = merge;
        }

        XLSX.utils.sheet_add_aoa(wsSheet, sheetData, {origin: "A1"});

          // @INFO Se agrega al workbook
        XLSX.utils.book_append_sheet(wb, wsSheet, report.title)
      }
      return wb

    } catch (e) {
      console.log('buildGeneralSurveyReportXLSX-error', e)
      return null
    }
  }

  /**
   * Metodo que permite consultar si una encuesta esta disponible
   * @param params
   * @returns
   */
  public generateReport = async (params: IGenerateSurveyReport) => {
    try {
      const userLogged: any = await User.findOne({ _id: params.user }).select('id profile.first_name profile.last_name')

      const time = new Date().getTime()

      // @INFO: Se define el formato del reporte, xlsx por defecto
      const output_format: any = params.output_format ? params.output_format : 'xlsx'
      const title: any = params.title ? params.title : `reporte_satisfaccion_${time}`

      // @INFO: Consultando el elemento relacionado a la encuesta
      let container_survey = null;
      let schedulingMode = null;
      let generalInfo: IReportSurveyGeneralInfo = null;
      if (params.course_scheduling) { // Si es una programación general
        container_survey = await CourseScheduling.findOne({_id: params.course_scheduling})
        .populate({path: 'schedulingMode', select: 'id name'})
        .populate({path: 'modular', select: 'id name'})
        .populate({path: 'program', select: 'id name code isAuditor'})
        .populate({path: 'client', select: 'id name'})
        .populate({path: 'city', select: 'id name'})
        .populate({path: 'schedulingType', select: 'id name'})
        .populate({path: 'regional', select: 'id name'})
        .populate({path: 'account_executive', select: 'id profile.first_name profile.last_name'})
        .select('_id schedulingMode modular program client city schedulingType regional account_executive metadata startDate endDate')
        .lean()
        if (container_survey) {
          schedulingMode = container_survey.schedulingMode._id

          let courseSchedulingDetails = {};
          const details = await CourseSchedulingDetails.find({
            course_scheduling: container_survey._id
          })
          .select('id course_scheduling teacher course startDate endDate duration sessions')
          .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
          .populate({path: 'course', select: 'id name code'})
          .lean();
          courseSchedulingDetails = details.reduce((accum, element) => {
            if (element?.course_scheduling) {
              if (!accum[element.course_scheduling.toString()]) {
                accum[element.course_scheduling.toString()] = []
              }
              accum[element.course_scheduling.toString()].push(element)
            }
            return accum
          }, {})

          let teacher = '-';
          if (courseSchedulingDetails[container_survey._id.toString()]) {
            const courses = courseSchedulingDetails[container_survey._id.toString()]
            const lastCourse = courses[courses.length - 1];
            teacher = (lastCourse?.teacher?.profile) ? `${lastCourse?.teacher.profile?.first_name} ${lastCourse?.teacher.profile?.last_name}` : '-';
          }
          generalInfo = {
            programName: container_survey?.program?.name || '-',
            programCode: container_survey?.program?.code || '-',
            teacher,
            serviceId: container_survey?.metadata?.service_id || '-',
            modalityName: container_survey?.schedulingMode?.name || '-',
            regional: container_survey?.regional?.name || '-',
            city: container_survey?.city?.name || '-',
            companyName: container_survey?.client?.name || '-',
            startDate: (container_survey?.startDate) ? moment(container_survey.startDate).format('DD/MM/YYYY') : '-',
            endDate: (container_survey?.endDate) ? moment(container_survey.endDate).format('DD/MM/YYYY') : '-',
            accountExecutive: (container_survey?.account_executive?.profile) ? `${container_survey?.account_executive?.profile.first_name} ${container_survey?.account_executive?.profile.last_name}` : '-',
            personWhoGeneratesReport: (userLogged?.profile) ? `${userLogged?.profile.first_name} ${userLogged?.profile.last_name}` : '-',
            reportDate: moment().format('DD/MM/YYYY'),
          }
        }
      } else if (params.course_scheduling_detail) { // Si es un curso dentro de una programación
        container_survey = await CourseSchedulingDetails.findOne({_id: params.course_scheduling_detail})
        .populate({path: 'course_scheduling', select: 'id schedulingMode modular program client city schedulingType regional account_executive metadata', populate: [
          {path: 'schedulingMode', select: 'id name'},
          {path: 'modular', select: 'id name'},
          {path: 'program', select: 'id name code isAuditor'},
          {path: 'client', select: 'id name'},
          {path: 'city', select: 'id name'},
          {path: 'schedulingType', select: 'id name'},
          {path: 'regional', select: 'id name'},
          {path: 'account_executive', select: 'id profile.first_name profile.last_name'},
        ]})
        .select('_id course_scheduling course teacher startDate endDate')
        .populate({path: 'course', select: 'id name code'})
        .populate({path: 'teacher', select: 'id profile.first_name profile.last_name'})
        .lean()

        if (container_survey) {
          schedulingMode = container_survey.course_scheduling.schedulingMode._id
          generalInfo = {
            programName: container_survey.course_scheduling?.program?.name || '-',
            programCode: container_survey.course_scheduling?.program?.code || '-',
            teacher: (container_survey?.teacher?.profile) ? `${container_survey?.teacher?.profile.first_name} ${container_survey?.teacher?.profile.last_name}` : '-',
            courseName: container_survey?.course?.name || '-',
            courseCode: container_survey?.course?.code || '-',
            serviceId: container_survey.course_scheduling?.metadata?.service_id || '-',
            modalityName: container_survey.course_scheduling?.schedulingMode?.name || '-',
            regional: container_survey.course_scheduling?.regional?.name || '-',
            city: container_survey.course_scheduling?.city?.name || '-',
            companyName: container_survey.course_scheduling?.client?.name || '-',
            accountExecutive: (container_survey.course_scheduling?.account_executive?.profile) ? `${container_survey.course_scheduling?.account_executive?.profile.first_name} ${container_survey.course_scheduling?.account_executive?.profile.last_name}` : '-',
            personWhoGeneratesReport: (userLogged?.profile) ? `${userLogged?.profile.first_name} ${userLogged?.profile.last_name}` : '-',
            reportDate: moment().format('DD/MM/YYYY'),
            startDate: (container_survey?.startDate) ? moment(container_survey.startDate).format('DD/MM/YYYY') : '-',
            endDate: (container_survey?.endDate) ? moment(container_survey.endDate).format('DD/MM/YYYY') : '-'
          }
        }
      }

      if (!container_survey) return responseUtility.buildResponseFailed('json', null, {error_key: 'survey.report.invalid_container'})
      if (!schedulingMode) return responseUtility.buildResponseFailed('json', null, {error_key: 'survey.report.invalid_container'})

      const aggregateQuery = [
        {
          $lookup: {
            from: 'academic_resource_configs',
            localField: 'config.content',
            foreignField: '_id',
            as: 'config.content'
          }
        },
        { $unwind: '$config.content' },
        {
          $lookup: {
            from: 'academic_resources',
            localField: 'config.content.academic_resource',
            foreignField: '_id',
            as: 'config.content.academic_resource'
          }
        },
        { $unwind: '$config.content.academic_resource' },
        {
          $match: {
            'config.content.config.course_modes': ObjectID(schedulingMode),
            'deleted': false,
            'status': 'enabled'
          }
        },
        {
          $group: {
            _id: '$_id',
            survey: { "$first": '$_id'},
            academic_resource_config: {$first: '$config.content'}
          }
        }
      ]

      const surveyData = await Survey.aggregate(aggregateQuery)
      if (!surveyData[0]) return responseUtility.buildResponseFailed('json', null, {error_key: 'survey.report.survey_not_found'})
      let questions = []
      if (
        surveyData[0].academic_resource_config &&
        surveyData[0].academic_resource_config.academic_resource &&
        surveyData[0].academic_resource_config.academic_resource.config &&
        surveyData[0].academic_resource_config.academic_resource.config.questions
      ) {
        questions = surveyData[0].academic_resource_config.academic_resource.config.questions
      }

      if (questions.length === 0) return responseUtility.buildResponseFailed('json', null, {error_key: 'survey.report.questions_not_found'})
      const question_ids = questions.reduce((acumm, element) => {
        acumm.push(element.question)
        return acumm
      }, [])
      const questionMongo = await Question.find({_id: {$in: question_ids}})
      .populate({path: 'question_category', select: 'id name description config'})

      const questionMongo_byIds = questionMongo.reduce((acumm, element) => {
        acumm[element._id] = element
        return acumm
      }, {})

      for (const question of questions) {
        if (questionMongo_byIds[question.question]) {
          question.question = questionMongo_byIds[question.question]
        }
      }

      questions = await academicResourceService.mergeContainerQuestions(questions)

      const question_by_category = {}
      const section_questions_range: ISectionQuestionsRange[] = []
      const section_questions_open: Record<string, ISectionQuestionsOpen> = {}
      const section_questions_choice_simple:  Record<string, ISectionQuestionsChoiceSimple> = {}
      for (const question of questions) {
        let item_questions_range: ISectionQuestionsRange = {
          _id: question.question._id,
          title: this.htmlEntitiesToUTF(question.question.content),
          questions: {},
          average: 0,
        }
        if (question.childs) {
          for (const child of question.childs) {
            if (!question_by_category[child.question._id]) {
              question_by_category[child.question._id] = child.question.question_category.name
            }
            if (child.question.question_category.name === 'select-range') {
              if (!item_questions_range.questions[child.question._id]) {
                item_questions_range.questions[child.question._id] = {
                  _id: child.question._id,
                  title: this.htmlEntitiesToUTF(child.question.content),
                  average: 0,
                  total_answers: 0,
                  answers: {
                    total: 0,
                    list: []
                  }
                }
              }
            } else if (child.question.question_category.name === 'open-answer') {
              if (!section_questions_open[child.question._id]) {
                section_questions_open[child.question._id] = {
                  _id: child.question._id,
                  title: this.htmlEntitiesToUTF(child.question.content),
                  answers: []
                }
              }
            } else if (child.question.question_category.name === 'multiple-choice-unique-answer') {
              if (!section_questions_choice_simple[child.question._id]) {
                const _item_multiple: ISectionQuestionsChoiceSimple = {
                  _id: child.question._id,
                  title: this.htmlEntitiesToUTF(child.question.content),
                  answers: {},
                  total_answers: 0,
                }

                if (child.question.answers) {
                  for (const _ans of child.question.answers) {
                    if (!_item_multiple['answers'][_ans.unique]) {
                      _item_multiple['answers'][_ans.unique] = {
                        unique: _ans.unique,
                        title: this.htmlEntitiesToUTF(_ans.content),
                        total_answers: 0,
                      }
                    }
                  }
                }

                section_questions_choice_simple[child.question._id] = _item_multiple
              }
            }
          }
        }

        section_questions_range.push(item_questions_range)
      }

      // @INFO: Consultando los resultados de los usuarios
      const academicResourceAttemps = await AcademicResourceAttempt.find({'results.surveyRelated': container_survey._id})

      for (const userAttemp of academicResourceAttemps) {
        if (userAttemp.results && userAttemp.results.statistics && Array.isArray(userAttemp.results.statistics)) {
          for (const result of userAttemp.results.statistics) {
            const category = (question_by_category[result.question.toString()]) ? question_by_category[result.question] : null

            switch (category) {
              case 'select-range':
                for (const section of section_questions_range) {
                  if (section.questions[result.question.toString()]) {
                    section.questions[result.question.toString()].total_answers += 1;
                    section.questions[result.question.toString()].answers.list.push(result.answer)
                    section.questions[result.question.toString()].answers.total += parseInt(result.answer)

                    section.questions[result.question.toString()].average = Math.round(((section.questions[result.question.toString()].answers.total / section.questions[result.question.toString()].total_answers)) * 100) / 100
                  }
                }
                break;
              case 'open-answer':
                if (section_questions_open[result.question.toString()]) {
                  section_questions_open[result.question.toString()].answers.push(result.answer)
                }
                break;
              case 'multiple-choice-unique-answer':
                if (section_questions_choice_simple[result.question.toString()] && section_questions_choice_simple[result.question.toString()].answers[result.answer]) {
                  section_questions_choice_simple[result.question.toString()].answers[result.answer].total_answers += 1;
                  section_questions_choice_simple[result.question.toString()].total_answers += 1;
                }
                break;
            }
          }
        }
      }

      const reportData = {
        generalInfo,
        section_questions_range,
        section_questions_open,
        section_questions_choice_simple,
      }

      if (output_format === 'xlsx') {
        // @INFO: Generación de reporte excel
        const wb = await this.buildXLSX(reportData, title)
        if (!wb) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_build_xlsx' })

        // @INFO Se carga el archivo al servidor
        const send = await xlsxUtility.uploadXLSX({ from: 'file', attached: { file: { name: `${title}.xlsx` } } }, {workbook: wb})
        if (!send) return responseUtility.buildResponseFailed('json', null, { error_key: 'reports.customReport.fail_upload_xlsx' })

        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            path: send,
          }
        })
      } else {
        return responseUtility.buildResponseSuccess('json', null, {
          additional_parameters: {
            data: reportData,
          }
        })
      }
    } catch (error) {
      return responseUtility.buildResponseFailed('json')
    }
  }

  /**
   * Metodo que permite reemplazar html entities por caracteres utf-8
   */
   private htmlEntitiesToUTF = (text: string): string => {
    return decode(text.toString().replace(/<[^>]*>?/gm, ''))
  }

  /**
   * Metodo que permite generar un archivo XLSX
   * @param data
   * @returns
   */
  private buildXLSX = async (data: IReportSurvey, title: string) => {

    try {
      // @INFO: Inicializamos el nuevo libro de excel
      const wb: XLSX.WorkBook = XLSX.utils.book_new();

      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([])

      const merge = []
      const sheet_data_aoa = []
      let row = 0;

      // @INFO: Información del servicio
      sheet_data_aoa.push(['PROGRAMA DE FORMACIÓN', data?.generalInfo?.programName])
      row++
      sheet_data_aoa.push(['CODIGO DEL PROGRAMA', data?.generalInfo?.programCode])
      row++
      if (data?.generalInfo?.courseCode && data?.generalInfo?.courseName) {
        sheet_data_aoa.push(['CURSO DE FORMACIÓN', data?.generalInfo?.courseName])
        row++
        sheet_data_aoa.push(['CODIGO DEL CURSO', data?.generalInfo?.courseCode])
        row++
      }
      if (data?.generalInfo?.startDate && data?.generalInfo?.endDate) {
        sheet_data_aoa.push(['FECHA DE INICIO', data?.generalInfo?.startDate])
        row++
        sheet_data_aoa.push(['FECHA DE FINALIZACIÓN', data?.generalInfo?.endDate])
        row++
      }
      sheet_data_aoa.push(['ID DEL SERVICIO', data?.generalInfo?.serviceId])
      row++
      sheet_data_aoa.push(['MODALIDAD', data?.generalInfo?.modalityName])
      row++
      sheet_data_aoa.push(['REGIONAL', data?.generalInfo?.regional])
      row++
      sheet_data_aoa.push(['CIUDAD', data?.generalInfo?.city])
      row++
      sheet_data_aoa.push(['CLIENTE', data?.generalInfo?.companyName])
      row++
      sheet_data_aoa.push(['EJECUTIVO DE CUENTA', data?.generalInfo?.accountExecutive])
      row++
      sheet_data_aoa.push(['DOCENTE', data?.generalInfo?.teacher])
      row++
      sheet_data_aoa.push(['NOMBRE PERSONA QUE CONSULTA', data?.generalInfo?.personWhoGeneratesReport])
      row++;
      sheet_data_aoa.push(['FECHA DEL REPORTE', data?.generalInfo?.reportDate])
      row++
      sheet_data_aoa.push([])
      row++

      if (data.section_questions_range) {
        let averageGeneral = {
          total: 0,
          amountRegisters: 0,
          average: 0
        };
        for (const section of data.section_questions_range) {
          if (Object.keys(section.questions).length > 0) {
            let total_question_for_section = 0;
            let total_answer_value = 0;

            const headers = [section.title, '']

            let itemMerge = {}
            itemMerge['s'] = {r: row, c: 0}
            itemMerge['e'] = {r: row, c: 1}
            row++

            sheet_data_aoa.push(headers)

            for (const question_id in section.questions) {
              if (Object.prototype.hasOwnProperty.call(section.questions, question_id)) {
                const data = []
                const question = section.questions[question_id];

                data.push(question.title)
                data.push(question.average)
                sheet_data_aoa.push(data)

                total_question_for_section += 1
                total_answer_value += question.average

                row++;
              }
            }

            if (total_question_for_section > 0) {
              const averageSection = Math.round(((total_answer_value / total_question_for_section) * 100)) / 100
              averageGeneral.total += averageSection
              averageGeneral.amountRegisters += 1;
              sheet_data_aoa.push(['Promedio', averageSection])
              row++;
            }

            sheet_data_aoa.push([])
            row++;

            if (Object.keys(itemMerge).length > 0) {
              merge.push(itemMerge)
            }
          }
        }

        averageGeneral.average = Math.round(((averageGeneral.total / averageGeneral.amountRegisters)) * 100) / 100
        sheet_data_aoa.push(['Promedio del curso', averageGeneral.average])
        row++

        sheet_data_aoa.push([])
        row++;
      }

      if (data.section_questions_choice_simple) {
        for (const question_id in data.section_questions_choice_simple) {
          if (Object.prototype.hasOwnProperty.call(data.section_questions_choice_simple, question_id)) {
            const question = data.section_questions_choice_simple[question_id];
            const headers = [question.title, '', '']

            let itemMerge = {}
            itemMerge['s'] = {r: row, c: 0}
            itemMerge['e'] = {r: row, c: 2}
            row++

            sheet_data_aoa.push(headers)

            const subheaders = ['Pregunta', 'Porcentaje', 'Cantidad de respuestas']
            sheet_data_aoa.push(subheaders)
            row++

            for (const answer_id in question.answers) {
              if (Object.prototype.hasOwnProperty.call(question.answers, answer_id)) {
                const answer = question.answers[answer_id];

                const data = []

                data.push(answer.title)

                let percentage = '0%';
                if (question.total_answers > 0) {
                  percentage = `${Math.round((answer.total_answers * 100) / question.total_answers)}%`;
                }
                data.push(percentage)
                data.push(answer.total_answers)
                sheet_data_aoa.push(data)
                row++;
              }
            }

            sheet_data_aoa.push([])
            row++;

            if (Object.keys(itemMerge).length > 0) {
              merge.push(itemMerge)
            }
          }
        }
      }

      if (data.section_questions_open) {
        for (const question_id in data.section_questions_open) {
          if (Object.prototype.hasOwnProperty.call(data.section_questions_open, question_id)) {
            const question = data.section_questions_open[question_id];
            const headers = [question.title]

            let itemMerge = {}
            itemMerge['s'] = {r: row, c: 0}
            itemMerge['e'] = {r: row, c: 0}
            row++

            sheet_data_aoa.push(headers)

            for (const answer of question.answers) {
              const data = []

              data.push(answer)
              sheet_data_aoa.push(data)
              row++;
            }

            sheet_data_aoa.push([])
            row++;

            if (Object.keys(itemMerge).length > 0) {
              merge.push(itemMerge)
            }
          }
        }
      }

      if (merge.length > 0) {
        ws["!merges"] = merge;
      }

      const cols = []
      for (let index = 0; index < 40; index++) {
        cols.push({width: 35})
      }

      ws["!cols"] = cols

      XLSX.utils.sheet_add_aoa(ws, sheet_data_aoa, {origin: "A1"});

      //@INFO Se agrega al workbook
      XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 30))

      return wb

    } catch (e) {
      return null
    }
  }

}

export const surveyDataService = new SurveyDataService();
export { SurveyDataService as DefaultDataAcademicContentSurveySurveyDataService };
