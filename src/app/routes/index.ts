// @import_routes
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
