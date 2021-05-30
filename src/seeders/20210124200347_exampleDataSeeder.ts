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

import {roleService} from '@scnode_app/services/default/admin/secure/roleService'
import {userService} from '@scnode_app/services/default/admin/user/userService'
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

    // @INFO: Agregando Noticias
    const news_ids = await this.addNews(post_types, post_locations)

    // @INFO: Agregando Noticias
    const events_ids = await this.addEvents(post_types, post_locations)

    // @INFO: Agregando Noticias
    const research_ids = await this.addResearch(post_types, post_locations)

    // @INFO: Agregando capsulas
    const capsules_ids = await this.addCapsules(post_types, post_locations)

    // @INFO: Agregando webinars
    const webinars_ids = await this.addWebinars(post_types, post_locations)

    // @INFO: Agregando webinars
    const blogs_ids = await this.addBlogs(post_types, post_locations)

    // @INFO: Agregando usuarios
    const user_ids = await this.addUsers()

    return false; // Always return true | false
  }

  // @add_more_methods

  /**
   * Metodo que permite agregar publicaciones
   * @returns
   */
  private addNews = async (post_types, post_locations) => {

    const newsContent = {
      "time" : 1617585310193.0,
      "blocks" : [
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 1"
          }
        },
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 2"
          }
        },
        {
          "type" : "quote",
          "data" : {
            "text" : "quote",
            "caption" : "",
            "alignment" : "left"
          }
        },
        {
          "type" : "list",
          "data" : {
              "style" : "ordered",
              "items" : [
                  "Lista",
                  "Dos",
                  "Tres"
              ]
          }
        },
        {
          "type" : "raw",
          "data" : {
              "html" : "Texto en formato HTML"
          }
        },
        {
          "type" : "checklist",
          "data" : {
            "items" : [
              {
                "text" : "Uno",
                "checked" : false
              },
              {
                "text" : "Dos",
                "checked" : false
              },
              {
                "text" : "Tres",
                "checked" : false
              },
              {
                "text" : "Cuatro",
                "checked" : false
              }
            ]
          }
        },
        {
          "type" : "table",
          "data" : {
            "content" : [
              [
                "Header 1",
                "Dato 1"
              ],
              [
                "Header 2",
                "Dato 2"
              ]
            ]
          }
        },
        {
          "type" : "header",
          "data" : {
            "text" : "Header 2",
            "level" : 2
          }
        },
        {
          "type" : "image",
          "data" : {
            "file" : {
              "url" : "http://127.0.0.1:3015/uploads/editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg",
              "relative_path" : "editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg"
            },
            "caption" : "",
            "withBorder" : false,
            "stretched" : false,
            "withBackground" : true
          }
        },
        {
          "type" : "linkTool",
          "data" : {
            "link" : "https://translate.google.com.co/?hl=es-419&amp;sl=es&amp;tl=en&amp;text=contenido%20de%20la%20publicacion&amp;op=translate",
            "meta" : {
              "title" : "Google Traductor",
              "site_name" : "",
              "description" : "El servicio gratuito de Google traduce al instante palabras, frases y páginas web del inglés a más de cien idiomas.",
              "image" : {
                "url" : ""
              }
            }
          }
        }
      ],
      "version" : "2.19.3"
    }

    const posts = [
      {
        title: "Noticia 1",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['news'],
        postDate: "2021-01-25 14:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['student'], viewCounter: 0},
          {postLocation: post_locations['teacher'], viewCounter: 0}
        ]
      },
      {
        title: "Noticia Guest 1",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['news'],
        postDate: "2021-02-25 14:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0},
        ]
      },
      {
        title: "Noticia Guest 2",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['news'],
        postDate: "2021-01-30 14:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0},
        ]
      },
      {
        title: "Noticia Guest 3",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['news'],
        postDate: "2021-06-25 14:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0},
        ]
      },
      {
        title: "Noticia Guest 4",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['news'],
        postDate: "2021-03-02 14:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0},
        ]
      },
      {
        title: "Noticia Guest 5",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['news'],
        postDate: "2021-05-07 14:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0},
        ]
      },
      {
        title: "Noticia Guest 6",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['news'],
        postDate: "2021-05-20 14:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0},
        ]
      },
      {
        title: "Noticia Guest 7",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['news'],
        postDate: "2021-01-25 14:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0},
        ]
      },
    ]

    const post_ids = await this.addPosts(post_types, post_locations, posts)
    return post_ids
  }

  /**
   * Metodo que permite agregar publicaciones
   * @returns
   */
  private addEvents = async (post_types, post_locations) => {

    const newsContent = {
      "time" : 1617585310193.0,
      "blocks" : [
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 1"
          }
        },
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 2"
          }
        },
        {
          "type" : "quote",
          "data" : {
            "text" : "quote",
            "caption" : "",
            "alignment" : "left"
          }
        },
        {
          "type" : "list",
          "data" : {
              "style" : "ordered",
              "items" : [
                  "Lista",
                  "Dos",
                  "Tres"
              ]
          }
        },
        {
          "type" : "raw",
          "data" : {
              "html" : "Texto en formato HTML"
          }
        },
        {
          "type" : "checklist",
          "data" : {
            "items" : [
              {
                "text" : "Uno",
                "checked" : false
              },
              {
                "text" : "Dos",
                "checked" : false
              },
              {
                "text" : "Tres",
                "checked" : false
              },
              {
                "text" : "Cuatro",
                "checked" : false
              }
            ]
          }
        },
        {
          "type" : "table",
          "data" : {
            "content" : [
              [
                "Header 1",
                "Dato 1"
              ],
              [
                "Header 2",
                "Dato 2"
              ]
            ]
          }
        },
        {
          "type" : "header",
          "data" : {
            "text" : "Header 2",
            "level" : 2
          }
        },
        {
          "type" : "image",
          "data" : {
            "file" : {
              "url" : "http://127.0.0.1:3015/uploads/editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg",
              "relative_path" : "editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg"
            },
            "caption" : "",
            "withBorder" : false,
            "stretched" : false,
            "withBackground" : true
          }
        },
        {
          "type" : "linkTool",
          "data" : {
            "link" : "https://translate.google.com.co/?hl=es-419&amp;sl=es&amp;tl=en&amp;text=contenido%20de%20la%20publicacion&amp;op=translate",
            "meta" : {
              "title" : "Google Traductor",
              "site_name" : "",
              "description" : "El servicio gratuito de Google traduce al instante palabras, frases y páginas web del inglés a más de cien idiomas.",
              "image" : {
                "url" : ""
              }
            }
          }
        }
      ],
      "version" : "2.19.3"
    }

    const posts = [
      {
        title: "Evento 1",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['events'],
        eventDate: "2021-01-25 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ]
      },
      {
        title: "Evento Guest 2",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['events'],
        eventDate: "2021-07-05 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ]
      },
      {
        title: "Evento Guest 3",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['events'],
        eventDate: "2021-05-15 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ]
      },
      {
        title: "Evento Guest 4",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['events'],
        eventDate: "2021-02-28 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ]
      },
      {
        title: "Evento Guest 5",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['events'],
        eventDate: "2021-06-20 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ]
      },
    ]

    const post_ids = await this.addPosts(post_types, post_locations, posts)
    return post_ids
  }

  /**
   * Metodo que permite agregar publicaciones
   * @returns
   */
  private addResearch = async (post_types, post_locations) => {

    const newsContent = {
      "time" : 1617585310193.0,
      "blocks" : [
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 1"
          }
        },
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 2"
          }
        },
        {
          "type" : "quote",
          "data" : {
            "text" : "quote",
            "caption" : "",
            "alignment" : "left"
          }
        },
        {
          "type" : "list",
          "data" : {
              "style" : "ordered",
              "items" : [
                  "Lista",
                  "Dos",
                  "Tres"
              ]
          }
        },
        {
          "type" : "raw",
          "data" : {
              "html" : "Texto en formato HTML"
          }
        },
        {
          "type" : "checklist",
          "data" : {
            "items" : [
              {
                "text" : "Uno",
                "checked" : false
              },
              {
                "text" : "Dos",
                "checked" : false
              },
              {
                "text" : "Tres",
                "checked" : false
              },
              {
                "text" : "Cuatro",
                "checked" : false
              }
            ]
          }
        },
        {
          "type" : "table",
          "data" : {
            "content" : [
              [
                "Header 1",
                "Dato 1"
              ],
              [
                "Header 2",
                "Dato 2"
              ]
            ]
          }
        },
        {
          "type" : "header",
          "data" : {
            "text" : "Header 2",
            "level" : 2
          }
        },
        {
          "type" : "image",
          "data" : {
            "file" : {
              "url" : "http://127.0.0.1:3015/uploads/editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg",
              "relative_path" : "editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg"
            },
            "caption" : "",
            "withBorder" : false,
            "stretched" : false,
            "withBackground" : true
          }
        },
        {
          "type" : "linkTool",
          "data" : {
            "link" : "https://translate.google.com.co/?hl=es-419&amp;sl=es&amp;tl=en&amp;text=contenido%20de%20la%20publicacion&amp;op=translate",
            "meta" : {
              "title" : "Google Traductor",
              "site_name" : "",
              "description" : "El servicio gratuito de Google traduce al instante palabras, frases y páginas web del inglés a más de cien idiomas.",
              "image" : {
                "url" : ""
              }
            }
          }
        }
      ],
      "version" : "2.19.3"
    }

    const posts = [
      {
        title: "Investigación Guest 1",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['research'],
        postDate: "2021-02-11 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Investigación Guest 2",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['research'],
        postDate: "2021-08-08 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Investigación Guest 3",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['research'],
        postDate: "2021-01-20 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Investigación Guest 4",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['research'],
        postDate: "2021-05-01 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Investigación Guest 5",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['research'],
        postDate: "2021-05-29 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      }
    ]

    const post_ids = await this.addPosts(post_types, post_locations, posts)
    return post_ids
  }

  /**
   * Metodo que permite agregar publicaciones
   * @returns
   */
  private addCapsules = async (post_types, post_locations) => {

    const newsContent = {
      "time" : 1617585310193.0,
      "blocks" : [
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 1"
          }
        },
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 2"
          }
        },
        {
          "type" : "quote",
          "data" : {
            "text" : "quote",
            "caption" : "",
            "alignment" : "left"
          }
        },
        {
          "type" : "list",
          "data" : {
              "style" : "ordered",
              "items" : [
                  "Lista",
                  "Dos",
                  "Tres"
              ]
          }
        },
        {
          "type" : "raw",
          "data" : {
              "html" : "Texto en formato HTML"
          }
        },
        {
          "type" : "checklist",
          "data" : {
            "items" : [
              {
                "text" : "Uno",
                "checked" : false
              },
              {
                "text" : "Dos",
                "checked" : false
              },
              {
                "text" : "Tres",
                "checked" : false
              },
              {
                "text" : "Cuatro",
                "checked" : false
              }
            ]
          }
        },
        {
          "type" : "table",
          "data" : {
            "content" : [
              [
                "Header 1",
                "Dato 1"
              ],
              [
                "Header 2",
                "Dato 2"
              ]
            ]
          }
        },
        {
          "type" : "header",
          "data" : {
            "text" : "Header 2",
            "level" : 2
          }
        },
        {
          "type" : "image",
          "data" : {
            "file" : {
              "url" : "http://127.0.0.1:3015/uploads/editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg",
              "relative_path" : "editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg"
            },
            "caption" : "",
            "withBorder" : false,
            "stretched" : false,
            "withBackground" : true
          }
        },
        {
          "type" : "linkTool",
          "data" : {
            "link" : "https://translate.google.com.co/?hl=es-419&amp;sl=es&amp;tl=en&amp;text=contenido%20de%20la%20publicacion&amp;op=translate",
            "meta" : {
              "title" : "Google Traductor",
              "site_name" : "",
              "description" : "El servicio gratuito de Google traduce al instante palabras, frases y páginas web del inglés a más de cien idiomas.",
              "image" : {
                "url" : ""
              }
            }
          }
        }
      ],
      "version" : "2.19.3"
    }

    const posts = [
      {
        title: "Capsula Guest 1",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['capsules'],
        postDate: "2021-02-11 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Capsula Guest 2",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['capsules'],
        postDate: "2021-08-08 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Capsula Guest 3",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['capsules'],
        postDate: "2021-01-20 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Capsula Guest 4",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['capsules'],
        postDate: "2021-05-01 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Capsula Guest 5",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['capsules'],
        postDate: "2021-05-29 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      }
    ]

    const post_ids = await this.addPosts(post_types, post_locations, posts)
    return post_ids
  }

  /**
   * Metodo que permite agregar publicaciones
   * @returns
   */
   private addWebinars = async (post_types, post_locations) => {

    const newsContent = {
      "time" : 1617585310193.0,
      "blocks" : [
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 1"
          }
        },
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 2"
          }
        },
        {
          "type" : "quote",
          "data" : {
            "text" : "quote",
            "caption" : "",
            "alignment" : "left"
          }
        },
        {
          "type" : "list",
          "data" : {
              "style" : "ordered",
              "items" : [
                  "Lista",
                  "Dos",
                  "Tres"
              ]
          }
        },
        {
          "type" : "raw",
          "data" : {
              "html" : "Texto en formato HTML"
          }
        },
        {
          "type" : "checklist",
          "data" : {
            "items" : [
              {
                "text" : "Uno",
                "checked" : false
              },
              {
                "text" : "Dos",
                "checked" : false
              },
              {
                "text" : "Tres",
                "checked" : false
              },
              {
                "text" : "Cuatro",
                "checked" : false
              }
            ]
          }
        },
        {
          "type" : "table",
          "data" : {
            "content" : [
              [
                "Header 1",
                "Dato 1"
              ],
              [
                "Header 2",
                "Dato 2"
              ]
            ]
          }
        },
        {
          "type" : "header",
          "data" : {
            "text" : "Header 2",
            "level" : 2
          }
        },
        {
          "type" : "image",
          "data" : {
            "file" : {
              "url" : "http://127.0.0.1:3015/uploads/editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg",
              "relative_path" : "editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg"
            },
            "caption" : "",
            "withBorder" : false,
            "stretched" : false,
            "withBackground" : true
          }
        },
        {
          "type" : "linkTool",
          "data" : {
            "link" : "https://translate.google.com.co/?hl=es-419&amp;sl=es&amp;tl=en&amp;text=contenido%20de%20la%20publicacion&amp;op=translate",
            "meta" : {
              "title" : "Google Traductor",
              "site_name" : "",
              "description" : "El servicio gratuito de Google traduce al instante palabras, frases y páginas web del inglés a más de cien idiomas.",
              "image" : {
                "url" : ""
              }
            }
          }
        }
      ],
      "version" : "2.19.3"
    }

    const posts = [
      {
        title: "Webinar Guest 1",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['webinar'],
        postDate: "2021-02-11 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Webinar Guest 2",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['webinar'],
        postDate: "2021-08-08 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Webinar Guest 3",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['webinar'],
        postDate: "2021-01-20 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Webinar Guest 4",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['webinar'],
        postDate: "2021-05-01 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Webinar Guest 5",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['webinar'],
        postDate: "2021-05-29 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      }
    ]

    const post_ids = await this.addPosts(post_types, post_locations, posts)
    return post_ids
  }

  /**
   * Metodo que permite agregar publicaciones
   * @returns
   */
   private addBlogs = async (post_types, post_locations) => {

    const newsContent = {
      "time" : 1617585310193.0,
      "blocks" : [
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 1"
          }
        },
        {
          "type" : "paragraph",
          "data" : {
            "text" : "Paragrafo 2"
          }
        },
        {
          "type" : "quote",
          "data" : {
            "text" : "quote",
            "caption" : "",
            "alignment" : "left"
          }
        },
        {
          "type" : "list",
          "data" : {
              "style" : "ordered",
              "items" : [
                  "Lista",
                  "Dos",
                  "Tres"
              ]
          }
        },
        {
          "type" : "raw",
          "data" : {
              "html" : "Texto en formato HTML"
          }
        },
        {
          "type" : "checklist",
          "data" : {
            "items" : [
              {
                "text" : "Uno",
                "checked" : false
              },
              {
                "text" : "Dos",
                "checked" : false
              },
              {
                "text" : "Tres",
                "checked" : false
              },
              {
                "text" : "Cuatro",
                "checked" : false
              }
            ]
          }
        },
        {
          "type" : "table",
          "data" : {
            "content" : [
              [
                "Header 1",
                "Dato 1"
              ],
              [
                "Header 2",
                "Dato 2"
              ]
            ]
          }
        },
        {
          "type" : "header",
          "data" : {
            "text" : "Header 2",
            "level" : 2
          }
        },
        {
          "type" : "image",
          "data" : {
            "file" : {
              "url" : "http://127.0.0.1:3015/uploads/editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg",
              "relative_path" : "editorjs/editor/liZOcAizcG2mG9q9s1FB.jpg"
            },
            "caption" : "",
            "withBorder" : false,
            "stretched" : false,
            "withBackground" : true
          }
        },
        {
          "type" : "linkTool",
          "data" : {
            "link" : "https://translate.google.com.co/?hl=es-419&amp;sl=es&amp;tl=en&amp;text=contenido%20de%20la%20publicacion&amp;op=translate",
            "meta" : {
              "title" : "Google Traductor",
              "site_name" : "",
              "description" : "El servicio gratuito de Google traduce al instante palabras, frases y páginas web del inglés a más de cien idiomas.",
              "image" : {
                "url" : ""
              }
            }
          }
        }
      ],
      "version" : "2.19.3"
    }

    const posts = [
      {
        title: "Blog Guest 1",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['blog'],
        postDate: "2021-02-11 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Blog Guest 2",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['blog'],
        postDate: "2021-08-08 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Blog Guest 3",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['blog'],
        postDate: "2021-01-20 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Blog Guest 4",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['blog'],
        postDate: "2021-05-01 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      },
      {
        title: "Blog Guest 5",
        subtitle: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eum, ad. Enim deleniti saepe delectus, provident dicta consequuntur voluptas debitis adipisci repellendus expedita est quos laboriosam quisquam doloribus eligendi. Labore, officiis.",
        coverUrl: "t7Uo80xyewbPDhFtWJqJ.jpeg",
        content: newsContent,
        postType: post_types['blog'],
        postDate: "2021-05-29 10:00:00",
        isActive: true,
        locations: [
          {postLocation: post_locations['guest'], viewCounter: 0}
        ],
        authors: ["Michael Schrage"]
      }
    ]

    const post_ids = await this.addPosts(post_types, post_locations, posts)
    return post_ids
  }

  /**
   * Metodo que permite agregar publicaciones
   * @returns
   */
   private addPosts = async (post_types, post_locations, posts) => {

    let post_ids = {}

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

  /**
   * Metodo que permite agregar usuarios
   * @param role_ids
   * @returns
   */
   private addUsers = async () => {
    let roles = {}
    const rolesResponse: any = await roleService.list()
    if (rolesResponse.status === 'success') {
      for await (const iterator of rolesResponse.roles) {
        roles[iterator.name] = iterator._id
      }
    }

    let user_ids = {}
    const users = [
      {
        username: 'userstudent',
        password: '123456',
        email: 'userstudent@example.com',
        phoneNumber: '3215550128',
        profile: {
          first_name: 'User',
          last_name: 'Student'
        },
        roles: [
          roles['student']
        ]
      }
    ]
    for await (const user of users) {
      const exists: any = await userService.findBy({
        query: QueryValues.ONE,
        where: [{field: 'username', value: user.username}]
      })
      if (exists.status === 'success') user['id'] = exists.user._id

      const user_response:any = await userService.insertOrUpdate(user)
      if (user_response.status === 'success') {
        user_ids[user.username] = user_response.user._id
      }
    }
    return user_ids
  }
  // @end
}

export const exampleDataSeeder = new ExampleDataSeeder();
export { ExampleDataSeeder };
