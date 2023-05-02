// @import_routes
import { termRoute } from "@scnode_app/routes/default/admin/term/termRoute";
import { courseSchedulingInformationRoute } from "@scnode_app/routes/default/admin/course/courseSchedulingInformationRoute";
import { statsRoute } from "@scnode_app/routes/default/data/stats/statsRoute";
import { courseSchedulingAssociationRoute } from "@scnode_app/routes/default/admin/course/courseSchedulingAssociationRoute";
import { reportsFactoryRoute } from "@scnode_app/routes/default/data/reports/reportsFactoryRoute";
import { certificateLogsRoute } from "@scnode_app/routes/default/admin/certificateQueue/certificateLogsRoute";
import { portfolioProgramRoute } from "@scnode_app/routes/default/admin/portfolio/portfolioProgramRoute";
import { documentQueueRoute } from "@scnode_app/routes/default/admin/documentQueue/documentQueueRoute";
import { qualifiedTeachersRoute } from "@scnode_app/routes/default/admin/qualifiedTeachers/qualifiedTeachersRoute";
import { attachedRoute } from "@scnode_app/routes/default/admin/attached/attachedRoute";
import { attachedCategoryRoute } from "@scnode_app/routes/default/admin/attachedCategory/attachedCategoryRoute";
import { likeRoute } from "@scnode_app/routes/default/admin/like/likeRoute";
import { forumTagsRoute } from "@scnode_app/routes/default/admin/forum/forumTagsRoute";
import { uploadAssetsRoute } from "@scnode_app/routes/default/general/upload/uploadAssetsRoute";
import { gradesRoute } from "@scnode_app/routes/default/admin/grades/gradesRoute";
import { certificateQueueRoute } from "@scnode_app/routes/default/admin/certificateQueue/certificateQueueRoute";
import { surveyDataRoute } from "@scnode_app/routes/default/data/academicContent/survey/surveyDataRoute";
import { certificateRoute } from "@scnode_app/routes/default/admin/certificate/certificateRoute";
import { courseSchedulingDataRoute } from "@scnode_app/routes/default/data/course/courseSchedulingDataRoute";
import { teacherProfileRoute } from "@scnode_app/routes/default/admin/teacherProfile/teacherProfileRoute";
import { landingDataRoute } from "@scnode_app/routes/default/data/landing/landingDataRoute";
import { landingRoute } from "@scnode_app/routes/default/admin/landing//landingRoute";
import { teacherRoute } from "@scnode_app/routes/default/admin/teacher/teacherRoute";
import { surveyEventRoute } from "@scnode_app/routes/default/events/academicContent/survey/surveyEventRoute";
import { academicResourceAttemptRoute } from "@scnode_app/routes/default/events/activity/academicResource/academicResourceAttemptRoute";
import { academicResourceDataRoute } from "@scnode_app/routes/default/data/academicContent/academicResource/academicResourceDataRoute";
import { surveyRoute } from "@scnode_app/routes/default/admin/academicContent/survey/surveyRoute";
import { academicResourceConfigRoute } from "@scnode_app/routes/default/admin/academicContent/academicResource/academicResourceConfigRoute";
import { academicResourceConfigCategoryRoute } from "@scnode_app/routes/default/admin/academicContent/academicResource/academicResourceConfigCategoryRoute";
import { academicResourceRoute } from "@scnode_app/routes/default/admin/academicContent/academicResource/academicResourceRoute";
import { academicResourceCategoryRoute } from "@scnode_app/routes/default/admin/academicContent/academicResource/academicResourceCategoryRoute";
import { questionRoute } from "@scnode_app/routes/default/admin/academicContent/questions/questionRoute";
import { questionCategoryRoute } from "@scnode_app/routes/default/admin/academicContent/questions/questionCategoryRoute";
import { courseSchedulingSectionRoute } from "@scnode_app/routes/default/admin/course/courseSchedulingSectionRoute";
import { courseSchedulingDetailsRoute } from "@scnode_app/routes/default/admin/course/courseSchedulingDetailsRoute";
import { courseContentRoute } from "@scnode_app/routes/default/admin/course/courseContentRoute";
import { masterCategoryRoute } from "@scnode_app/routes/default/admin/course/masterCategoryRoute";
import { masterCourseRoute } from "@scnode_app/routes/default/admin/course/masterCourseRoute";
import { cityRoute } from "@scnode_app/routes/default/admin/city/cityRoute";
import { modularRoute } from "@scnode_app/routes/default/admin/modular/modularRoute";
import { courseSchedulingModeRoute } from "@scnode_app/routes/default/admin/course/courseSchedulingModeRoute";
import { courseSchedulingTypeRoute } from "@scnode_app/routes/default/admin/course/courseSchedulingTypeRoute";
import { courseSchedulingStatusRoute } from "@scnode_app/routes/default/admin/course/courseSchedulingStatusRoute";
import { programRoute } from "@scnode_app/routes/default/admin/program/programRoute";
import { courseSchedulingRoute } from "@scnode_app/routes/default/admin/course/courseSchedulingRoute";
import { regionalRoute } from "@scnode_app/routes/default/admin/regional/regionalRoute";
import { enrolledCourseRoute } from "@scnode_app/routes/default/data/enrolledCourse/enrolledCourseRoute";
import { bannerDataRoute } from "@scnode_app/routes/default/data/banner/bannerDataRoute";
import { courseModeCategoryRoute } from "@scnode_app/routes/default/admin/course/courseModeCategoryRoute";
import { calendarEventsRoute } from "@scnode_app/routes/default/data/calendarEvents/calendarEventsRoute";
import { courseDataRoute } from "@scnode_app/routes/default/data/course/courseDataRoute";
import { userDataRoute } from "@scnode_app/routes/default/data/user/userDataRoute";
import { companyDataRoute } from "@scnode_app/routes/default/data/company/companyDataRoute";
import { companyRoute } from "@scnode_app/routes/default/admin/company/companyRoute";
import { bannerRoute } from "@scnode_app/routes/default/admin/banner/bannerRoute";
import { completionstatusRoute } from "@scnode_app/routes/default/admin/completionStatus/completionstatusRoute";
import { enrollmentRoute } from "@scnode_app/routes/default/admin/enrollment/enrollmentRoute";
import { editorJsRoute } from "@scnode_app/routes/default/admin/editorJs/editorJsRoute";
import { homeRoute } from "@scnode_app/routes/default/admin/home/homeRoute";
import { environmentRoute } from "@scnode_app/routes/default/admin/secure/environment/environmentRoute";
import { courseRoute } from "@scnode_app/routes/default/admin/course/courseRoute";
import { skillTypeRoute } from "@scnode_app/routes/default/admin/user/skillTypeRoute";
import { postDataRoute } from "@scnode_app/routes/default/data/post/postDataRoute";
import { forumDataRoute } from "@scnode_app/routes/default/data/forum/forumDataRoute";
import { forumMessageRoute } from "@scnode_app/routes/default/events/forum/forumMessageRoute";
import { forumRoute } from "@scnode_app/routes/default/admin/forum/forumRoute";
import { forumLocationRoute } from "@scnode_app/routes/default/admin/forum/forumLocationRoute";
import { forumCategoryRoute } from "@scnode_app/routes/default/admin/forum/forumCategoryRoute";
import { authRoute } from "@scnode_app/routes/default/data/secure/auth/authRoute";
import { countryRoute } from "@scnode_app/routes/default/admin/country/countryRoute";
import { userRoute } from "@scnode_app/routes/default/admin/user/userRoute";
import { appModuleRoute } from "@scnode_app/routes/default/admin/secure/appModule/appModuleRoute";
import { appModulePermissionRoute } from "@scnode_app/routes/default/admin/secure/appModule/appModulePermissionRoute";
import { roleRoute } from "@scnode_app/routes/default/admin/secure/roleRoute";
import { postRoute } from "@scnode_app/routes/default/admin/post/postRoute";
import { postTypeRoute } from "@scnode_app/routes/default/admin/post/postTypeRoute";
import { postLocationRoute } from "@scnode_app/routes/default/admin/post/postLocationRoute";
import { postCategoryRoute } from "@scnode_app/routes/default/admin/post/postCategoryRoute";
// @end

// @export_routes
export const routes = {
  // @add_routes_object
    termRoute,
    courseSchedulingInformationRoute,
    statsRoute,
    courseSchedulingAssociationRoute,
    reportsFactoryRoute,
    certificateLogsRoute,
    portfolioProgramRoute,
    documentQueueRoute,
    qualifiedTeachersRoute,
    attachedRoute,
    attachedCategoryRoute,
    likeRoute,
    forumTagsRoute,
    uploadAssetsRoute,
    gradesRoute,
    certificateQueueRoute,
    surveyDataRoute,
    certificateRoute,
    courseSchedulingDataRoute,
    teacherProfileRoute,
    landingDataRoute,
    landingRoute,
    teacherRoute,
    surveyEventRoute,
    academicResourceAttemptRoute,
    academicResourceDataRoute,
    surveyRoute,
    academicResourceConfigRoute,
    academicResourceConfigCategoryRoute,
    academicResourceRoute,
    academicResourceCategoryRoute,
    questionRoute,
    questionCategoryRoute,
    courseSchedulingSectionRoute,
    courseSchedulingDetailsRoute,
    courseContentRoute,
    masterCategoryRoute,
    masterCourseRoute,
    cityRoute,
    modularRoute,
    courseSchedulingModeRoute,
    courseSchedulingTypeRoute,
    courseSchedulingStatusRoute,
    programRoute,
    courseSchedulingRoute,
    regionalRoute,
    enrolledCourseRoute,
    bannerDataRoute,
    courseModeCategoryRoute,
    calendarEventsRoute,
    courseDataRoute,
    userDataRoute,
    companyDataRoute,
    companyRoute,
    bannerRoute,
    completionstatusRoute,
    enrollmentRoute,
    editorJsRoute,
    homeRoute,
    environmentRoute,
    courseRoute,
    skillTypeRoute,
    postDataRoute,
    forumDataRoute,
    forumMessageRoute,
    forumRoute,
    forumLocationRoute,
    forumCategoryRoute,
    authRoute,
    countryRoute,
    userRoute,
    appModuleRoute,
    appModulePermissionRoute,
    roleRoute,
    postRoute,
    postTypeRoute,
    postLocationRoute,
    postCategoryRoute,
	// @end
}
// @end
