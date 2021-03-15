// @import_routes
import { homeRoute } from "@scnode_app/routes/default/admin/home/homeRoute";
import { environmentRoute } from "@scnode_app/routes/default/admin/secure/environment/environmentRoute";
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
    homeRoute,
    environmentRoute,
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
