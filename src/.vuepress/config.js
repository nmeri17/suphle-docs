const { description } = require("../../package")

module.exports = {
  /**
   * Ref：https://v1.vuepress.vuejs.org/config/#title
   */
  title: "Suphle",
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
    ["meta", { name: "theme-color", content: "#6407a2" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "black" }]
  ],

  theme: "vt",

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    enableDarkMode: true,
    repo: "https://github.com/nmeri17/suphle",
    docsRepo: "https://github.com/nmeri17/suphle-docs",
    editLinks: true,
    docsDir: "src",
    editLinkText: "Help us improve this page",
    //lastUpdated: true,

    logo: "/logo.svg",
    searchPlaceholder: 'Search topic',
    base: "/suphple-docs/", // folder name

    sidebarDepth: 3,
    nav: [
      {
        text: "Quick Start",
        link: "/docs/v1/quick-start/",
      }/*,
      {
        text: "Suphle on Github",
        link: "https://github.com/nmeri17/suphle"
      },
      {
        text: 'Languages',
        ariaLabel: 'Language Menu',
        items: [
          { text: 'Italian', link: '/language/italian/' },
          { text: 'Spanish', link: '/language/spanish/' }
        ]
      }*/
    ],
    sidebar: [
      ["/docs/v1/quick-start/", "Quick Start"],

      ["/docs/v1/modules/", "Modules"], ["/docs/v1/container/", "Container"],

      ["/docs/v1/testing/", "Testing"], // interlude

      ["/docs/v1/routing/", "Routing"], ["/docs/v1/service-coordinators/", "Service Coordinators"],

      ["/docs/v1/events/", "Events"], ["/docs/v1/queues/", "Queues"], ["/docs/v1/environment/", "Environment"],

      ["/docs/v1/authentication/", "Authentication"], ["/docs/v1/authorization/", "Authorization"], ["/docs/v1/database/", "Database"], ["/docs/v1/image-upload/", "Image upload"],

      ["/docs/v1/middleware/", "Middleware"], ["/docs/v1/exceptions/", "Exceptions"],
      ["/docs/v1/templating/", "Templating"],
      ["/docs/v1/io/", "IO"], ["/docs/v1/http/", "Outbound Requests"],

      ["/docs/v1/flows/", "Flows"], ["/docs/v1/bridges/", "Framework Bridge"], ["/docs/v1/console/", "Console Commands"],

      ["/docs/v1/component-templates/", "Component-templates"], ["/docs/v1/application-server/", "Application-server"], ["/docs/v1/credits/", "Credits"],

      ["/docs/v1/appendix/", "Appendix"]
    ],
    plugins: {
      '@vuepress-plugin-sitemap': {
        hostname: 'https://suphle.com'
      }
    }
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [ // vendor/title (can be gotten from package.json)
    "@vuepress/plugin-back-to-top",
    "@vuepress/plugin-register-components",
    "@vuepress/plugin-active-header-links",
    //"@vuepress/plugin-search",
    "@vuepress/plugin-nprogress",
    "@vuepress/plugin-check-md", // run with vuepress check-md [docsDir]. Optionally add the --fix flag
    "versioning" // not working now
  ]
}

/*https://github.com/lorisleiva/vuepress-plugin-seo
https://github.com/webmasterish/vuepress-plugin-minimal-analytics
https://github.com/webmasterish/vuepress-plugin-autometa
*/
