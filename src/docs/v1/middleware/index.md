# MIDDLEWARE

These represent common functionality we want to run before or after a request hits its action handler. *Common* in this context refers to behavior that is apllicable to diverse endpoints. They **shouldn't** be used for purposes that don't directly interact with the request/response objects.

Middleware runs after the request itself has been validated

Since routes are being composed down tries, route collections middlewares should contain references to what pattern method they are bound to.

How do we pass arguments to middleware from their definition point? How do I register global middleware that runs on all requests?