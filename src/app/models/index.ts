// @import_models
import { AppModulePermissionModel } from "@scnode_app/models/appModulePermissionModel";
import { AppModuleModel } from "@scnode_app/models/appModuleModel";
import { RoleModel } from "@scnode_app/models/roleModel";
import { SeederModel } from "@scnode_app/models/seederModel";
import { PostCategoryModel } from "@scnode_app/models/postCategoryModel";
import { PostLocationModel } from "@scnode_app/models/postLocationModel";
import { PostTypeModel } from "@scnode_app/models/postTypeModel";
import { PostModel } from "@scnode_app/models/postModel";
import { CountryModel } from "@scnode_app/models/countryModel";
import { UserModel } from "@scnode_app/models/userModel";
// @end

// @export_models
export const AppModulePermission = AppModulePermissionModel
export const AppModule = AppModuleModel
export const Role = RoleModel
export const Seeder = SeederModel
export const PostCategory = PostCategoryModel
export const PostLocation = PostLocationModel
export const PostType = PostTypeModel
export const Post = PostModel
export const Country = CountryModel
export const User = UserModel
// @end

export const model_example = "ModelExample";
