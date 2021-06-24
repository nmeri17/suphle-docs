import Vue from 'vue'
Vue.component("OtherComponent", () => import("C:\\Users\\NMERI\\Documents\\docs\\src\\.vuepress\\components\\OtherComponent"))
Vue.component("demo-component", () => import("C:\\Users\\NMERI\\Documents\\docs\\src\\.vuepress\\components\\demo-component"))
Vue.component("Foo-Bar", () => import("C:\\Users\\NMERI\\Documents\\docs\\src\\.vuepress\\components\\Foo\\Bar"))
Vue.component("Badge", () => import("C:\\Users\\NMERI\\Documents\\docs\\node_modules\\vuepress-theme-antdocs\\global-components\\Badge"))


export default {}