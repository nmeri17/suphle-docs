## Anatomy of a Suphple module

The entire illustration is a bird's eyeview of each module's ultimate structure. The segments which a user's request cuts through are the ones you are ~~likely~~ expected to change frequently -- otherwise called "moving parts". They are the ones we want to get right in a way that allows them remain elegant both during and after modification.

::: tip
We want their APIs to grow with interfaces so they can maintain their integrity while being swapped out/tampered with.
:::

While the figure above may be theoretically true, the eventful journey of a request isn't quite the same in practice.

## Request lifecycle

Though not compulsory, it's strongly recommended to compartmentalize your app into [modules](/docs/v1/modules). Modules exist independently, which means tend to contain their own routes and exist in a state where they can be deployed without knowledge of its sibling modules' internals i.e. their routes.

For every request received by your app, it's apportioned to its appropriate handler before being passed onto a module where applicable.

There are 3 different kinds of request, which are in turn, subdivided into their subcategories. Suphple has [login requests](/docs/v1/authentication), [flow requests](/docs/v1/flows), and [regular requests](/docs/v1/controllers)

For regular requests, core classes (router, event manager etc.) instantiated after module initialization point is crossed take on a new dimension — one with context and purpose within its module. Mere autoload is no longer enough to fully grasp the classes intended objective without scope