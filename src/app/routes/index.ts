// @import_routes
import { postTypeRoute } from "@scnode_app/routes/default/admin/post/postTypeRoute";
import { postLocationRoute } from "@scnode_app/routes/default/admin/post/postLocationRoute";
import { postCategoryRoute } from "@scnode_app/routes/default/admin/post/postCategoryRoute";
// @end

// @export_routes
export const routes = {
  // @add_routes_object
    postTypeRoute,
    postLocationRoute,
    postCategoryRoute,
	// @end
}
// @end
