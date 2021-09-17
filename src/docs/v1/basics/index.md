# Suphple Basics

## Anatomy of a Suphple module

![suphple-module](/suphple-module.jpeg)

The illustration above is a bird's eye-view of each module's ultimate structure. The request gets to the framework first, which then utilizes the layers above and around it to produce a response. The two circles at the bottom represent the outskirts of the module, which can be imagined as a link to other modules with similar structure. They ultimately converge at your [app's entry point](/docs/v1/modules#app-entry-point), where you will have mechanisms that act as glue to hold them all together.

The segments which a user's request cuts through are the ones you are ~~likely~~ expected to change frequently -- otherwise called "moving parts". They are the ones we want to get right in a way that allows them remain elegant both during and after modification.

::: tip
We want their APIs to grow with interfaces so they can maintain their integrity while being [swapped out](/docs/v1/container#contextual-binding)/tampered with.
:::

While the figure above may be theoretically true, the eventful journey of a request isn't quite the same in practice.

## Request lifecycle

Though not compulsory, it's strongly recommended to compartmentalize your app into [modules](/docs/v1/modules). Modules exist independently, which means they tend to contain their own routes and exist in a state where they can be deployed without knowledge of their sibling modules' internal details.

For every request received by your app, it's apportioned to its appropriate handler before being passed onto a module where applicable.

Suphple has 3 different kinds of request, which are in turn, subdivided into their subcategories:
- [Login requests](/docs/v1/authentication)
- [Flow requests](/docs/v1/flows)
- [Regular requests](/docs/v1/controllers)

When framework deciphers incoming request is a regular one, it cycles from module to module. First, each module is booted into an intermediary state from which its autonomous router can be queried for a match against incoming request. The *booting* generally involves preliminary activities such as [object binding](/docs/v1/container#contextual-binding) required to identify matching requests.

When a module informs Suphple about its ability to handle request, the rest of the module is initialized e.g. [event listeners](/docs/v1/events#listeners) are mounted. The purpose of personalizing internal objects before routing commences is they are all expected to *not* know about context of other modules. Autoloading them shouldn't reveal information conflicting with context of the present scope. This is important considering the fact that all things being equal, every single dependency should be [autoloaded](/docs/v1/container#auto-wiring).

After initialization completes, authentication, authorization and validation checks are performed. If they all succeed, a [middleware](/docs/v1/middleware) stack is assembled, to convene and decide whether they will rather handle request, or delegate to whatever handler is designated in their module's router. With their permission, request can then reach your controllers, and compute a response data which is forwarded to the renderer assigned in the router.

This is usually the last stage for requests before they get flushed to the client (which could be anything from browsers to mobile devices).

Quite an adventure, you'll say. Now, we'll be accompanying the request to all the landmarks described here. We'll first study modules as it happens to be the umbrella under which all the components we are interested in reside.