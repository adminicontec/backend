// @import_services Import Services
import { DefaultPluginsSeederSeederService } from "@scnode_core/services/default/plugins/seeder/seederService";
// @end

// @import_models Import models
// @end

// @import_utilitites Import utilities
// @end

// @import services
import {postService} from '@scnode_app/services/default/admin/post/postService'
import {postTypeService} from '@scnode_app/services/default/admin/post/postTypeService'
import {postLocationService} from '@scnode_app/services/default/admin/post/postLocationService'
// @end

// @import_types Import types
import {QueryValues} from '@scnode_app/types/default/global/queryTypes'
// @end

class ExampleDataSeeder extends DefaultPluginsSeederSeederService {

  /**
   * Metodo que contiene la logica del seeder
   * @return Booleano que identifica si se pudo o no ejecutar el Seeder
   */
  public run = async () => {
    // @seeder_logic Add seeder logic

    // @INFO: Agregando publicaciones
    const post_ids = await this.addPosts()
    // @end

    return false; // Always return true | false
  }

  // @add_more_methods

  /**
   * Metodo que permite agregar publicaciones
   * @returns
   */
  private addPosts = async () => {

    let post_types = {}
    const postTypesResponse: any = await postTypeService.list()
    if (postTypesResponse.status === 'success') {
      for await (const iterator of postTypesResponse.postTypes) {
        post_types[iterator.name] = iterator._id
      }
    }

    let post_locations = {}
    const postLocationsResponse: any = await postLocationService.list()
    if (postLocationsResponse.status === 'success') {
      for await (const iterator of postLocationsResponse.postLocations) {
        post_locations[iterator.name] = iterator._id
      }
    }

    let post_ids = {}
    const posts = [
      {
        title: "Noticia 1",
        content: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Excepturi omnis tempora a labore suscipit cum amet recusandae tempore minima. Ab dolore quisquam necessitatibus labore eum perferendis cupiditate voluptate a ad!",
        postType: post_types['news'],
        postDate: "2021-01-25 14:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['student'], viewCounter: 0},
          {postLocation: post_locations['teacher'], viewCounter: 0}
        ]
      },
      {
        title: "Evento 1",
        content: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Excepturi omnis tempora a labore suscipit cum amet recusandae tempore minima. Ab dolore quisquam necessitatibus labore eum perferendis cupiditate voluptate a ad!",
        postType: post_types['events'],
        postDate: "2021-01-25 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ]
      }
    ]

    for await (const post of posts) {
      const exists: any = await postService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'title', value: post.title}]
      })
      if (exists.status === 'success') post['id'] = exists.post._id

      const response:any = await postService.insertOrUpdate(post)
      if (response.status === 'success') {
        post_ids[post.title] = response.post._id
      }
    }
    return post_ids
  }
  // @end
}

export const exampleDataSeeder = new ExampleDataSeeder();
export { ExampleDataSeeder };
