import Vue from 'vue'
Vue.component("demo-component", () => import("C:\\Users\\NMERI\\Documents\\docs\\src\\.vuepress\\components\\demo-component"))
Vue.component("OtherComponent", () => import("C:\\Users\\NMERI\\Documents\\docs\\src\\.vuepress\\components\\OtherComponent"))
Vue.component("Foo-Bar", () => import("C:\\Users\\NMERI\\Documents\\docs\\src\\.vuepress\\components\\Foo\\Bar"))
Vue.component("CodeBlock", () => import("C:\\Users\\NMERI\\Documents\\docs\\node_modules\\@vuepress\\theme-default\\global-components\\CodeBlock"))
Vue.component("Badge", () => import("C:\\Users\\NMERI\\Documents\\docs\\node_modules\\@vuepress\\theme-default\\global-components\\Badge"))
Vue.component("CodeGroup", () => import("C:\\Users\\NMERI\\Documents\\docs\\node_modules\\@vuepress\\theme-default\\global-components\\CodeGroup"))


export default {}