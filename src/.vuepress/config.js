const { description } = require("../../package")

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: "Suphple Docs",
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#description
   */
  description: description,

  /**
   * Extra tags to be injected to the page HTML `<head>`
   *
   * ref：https://v1.vuepress.vuejs.org/config/#head
   */
  head: [
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "black" }]
  ],

  theme: "antdocs",

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: "https://github.com/nmeri17/tilwa",
    docsRepo: "https://github.com/nmeri17/suphple-docs",
    editLinks: false,
    docsDir: "",
    editLinkText: "",
    lastUpdated: true,

    logo: "logo.jpg",
    nav: [
      {
        text: "Quick Start",
        link: "/docs/v1/quick-start/",
      },
      {
        text: "Basics",
        link: "/docs/v1/basics/"
      },
      /*{
        text: "Suphple on Github",
        link: "https://github.com/nmeri17/tilwa"
      }{
        text: 'Languages',
        ariaLabel: 'Language Menu',
        items: [
          { text: 'Italian', link: '/language/italian/' },
          { text: 'Spanish', link: '/language/spanish/' }
        ]
      }*/
    ],
    sidebar: [
      ["/docs/v1/quick-start/", "Quick Start"], ["/docs/v1/basics/", "Basics"], ["/docs/v1/motivation/", "Motivation"],

      ["/docs/v1/modules/", "Modules"], ["/docs/v1/container/", "Container"], ["/docs/v1/service-providers/", "Service Providers"],

      ["/docs/v1/testing/", "Testing"], // interlude

      ["/docs/v1/routing/", "Routing"], ["/docs/v1/requests/", "Requests"], ["/docs/v1/controllers/", "Controllers"],

      ["/docs/v1/events/", "Events"], ["/docs/v1/queues/", "Queues"], ["/docs/v1/config/", "Config"],

      ["/docs/v1/authentication/", "Authentication"], ["/docs/v1/authorization/", "Authorization"],

      ["/docs/v1/middleware/", "Middleware"], ["/docs/v1/error-handling/", "Error Handling"],
      ["/docs/v1/templating/", "Templating"], // this and database should probably go under "adapters"

      ["/docs/v1/flows/", "Flows"], ["/docs/v1/laravel-interop/", "Laravel Inter-op"],

      ["/docs/v1/plugins/", "Plugins"], ["/docs/v1/contributing/", "Contributing"], ["/docs/v1/credits/", "Credits"]
    ]
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    "@vuepress/plugin-back-to-top",
    "@vuepress/plugin-medium-zoom",
    "@vuepress/plugin-last-updated",
    "@vuepress/plugin-register-components",
    "@vuepress/plugin-active-header-links",
    "@vuepress/plugin-search",
    "@vuepress/plugin-nprogress",
    "vuepress-theme-antdocs"
  ]
}
