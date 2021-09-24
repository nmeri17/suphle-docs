## Middleware

These represent common functionality we want to run before or after a request hits its action handler. *Common* in this context refers to behavior that is apllicable to diverse endpoints. They **shouldn't** be used for purposes that don't directly interact with the request/response objects.

Middleware runs after the request itself has been validated

Two kinds of middleware are supported: those that run on every request and those assigned to specific patterns

## Global Middleware

These refer to middleware that should run on all requests. They are assigned through the route middleware in an ascending order of execution
/// example

With this kind of middleware, one cannot pass in specific parameters as it is meant to apply to all possible paths. However, while working with specific middleware, we can afford to do just that

## Specific Middleware

Since patterns are being composed down tries, route collections middlewares should contain references to what pattern method they are bound to. But since patterns can contain nested collections, their internal patterns would have to be able to detach themselves from what middleware their parents activated

How do we pass arguments to middleware from their definition point?