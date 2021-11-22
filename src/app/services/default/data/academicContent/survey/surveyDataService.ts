// @import_dependencies_node Import libraries
import * as XLSX from "xlsx";
const ObjectID = require('mongodb').ObjectID
import {decode} from 'html-entities';
import { xlsxUtility } from '@scnode_core/utilities/xlsx/xlsxUtility'
// @end

// @import services
import {academicResourceService} from '@scnode_app/services/default/admin/academicContent/academicResource/academicResourceService'
// @end

// @import utilities
import { responseUtility } from '@scnode_core/utilities/responseUtility';
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
} from '@scnode_app/types/default/data/academicContent/survey/surveyDataTypes'
import { AcademicResourceAttempt, CourseScheduling, CourseSchedulingDetails, Question, Survey } from '@scnode_app/models';
// @end

class SurveyDataService {

  /*===============================================
  =            Estructura de un metodo            =
  ================================================
    // La estructura de un metodo debe ser la siguiente:
    public methodName = () => {}
  /*======  End of Estructura de un metodo  =====*/

  constructor () {}

  /**
   * Metodo que permite consultar si una encuesta esta disponible
   * @param params
   * @returns
   */
   public generateReport = async (params: IGenerateSurveyReport) => {
    try {

      const time = new Date().getTime()

      // @INFO: Se define el formato del reporte, xlsx por defecto
      const output_format: any = params.output_format ? params.output_format : 'xlsx'
      const title: any = params.title ? params.title : `reporte_satisfaccion_${time}`

      // @INFO: Consultando el elemento relacionado a la encuesta
      let container_survey = null;
      let schedulingMode = null;
      if (params.course_scheduling) { // Si es una programación general
        container_survey = await CourseScheduling.findOne({_id: params.course_scheduling})
        .populate({path: 'schedulingMode', select: 'id name'})
        .select('_id schedulingMode')
        .lean()
        if (container_survey) {
          schedulingMode = container_survey.schedulingMode._id
        }
      } else if (params.course_scheduling_detail) { // Si es un curso dentro de una programación
        container_survey = await CourseSchedulingDetails.findOne({_id: params.course_scheduling_detail})
        .populate({path: 'course_scheduling', select: 'id schedulingMode', populate: [
          {
            path: 'schedulingMode', select: 'id name'
          },
        ]})
        .select('_id course_scheduling')
        .lean()

        if (container_survey) {
          schedulingMode = container_survey.course_scheduling.schedulingMode._id
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
      // console.log('questions', questions)

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
        // console.log('question', question.question.question_category)
        if (question.childs) {
          for (const child of question.childs) {
            if (!question_by_category[child.question._id]) {
              // console.log('child', child)
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
                  answers: {}
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
            // console.log('child.question.question_category', child.question.question_category)
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

                    section.questions[result.question.toString()].average = Math.round(((section.questions[result.question.toString()].answers.total / section.questions[result.question.toString()].total_answers) * 100)) / 100
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
                }
                break;
            }
          }
        }
      }

      const reportData = {
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
      if (data.section_questions_range) {
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
              sheet_data_aoa.push(['Promedio', Math.round(((total_answer_value / total_question_for_section) * 100)) / 100])
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

      if (data.section_questions_choice_simple) {
        for (const question_id in data.section_questions_choice_simple) {
          if (Object.prototype.hasOwnProperty.call(data.section_questions_choice_simple, question_id)) {
            const question = data.section_questions_choice_simple[question_id];
            const headers = [question.title, '']

            let itemMerge = {}
            itemMerge['s'] = {r: row, c: 0}
            itemMerge['e'] = {r: row, c: 1}
            row++

            sheet_data_aoa.push(headers)

            for (const answer_id in question.answers) {
              if (Object.prototype.hasOwnProperty.call(question.answers, answer_id)) {
                const answer = question.answers[answer_id];

                const data = []

                data.push(answer.title)
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
