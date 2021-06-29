## Graphql clone
In addition to the regular request aggregation, Graphql library should enable some kind of stream (possible RPC?) for `build`ing pivot results out of service methods, so they don't fetch to their own back ends and process before returning to their client apps

## Flows
Flows have a `hydrate` method that can instantiate a flow from an incoming request. Useful for 3rd party consumers of the api
works only for post requests. we check if that key exists (as a json structure conforming to a ControllerFlow) in the incoming payload. set the hydrated controller flow on a [thirdParty] property the flow wrapper. then when it's time to queue outgoing renderer's branches, if this property 
isn't empty, work with it instead

## Open API
Can we interface between request objects and swagger for generating documentation? See https://github.com/calcinai/strut

For schemas/models, check if it's an instance of the active driver model

## Integration
Look into integrating asynchronous and concurrent frameworks

## File Upload
Image upload add a `withThumbnail` method for creating thumbnails

## Authentication
Passwordless authentication module. Won't include password reset routes
Implement auth services (email verification, password recovery) dev can inject in their controllers

## Service and controllers
Is it possible to have repositories like mongo repositories that work like mongo repositories? i.e. hiding service level functionality behind non-existent methods, dynamic, defined on an interface we will get to implement

## Routing
**Caching**
- all the routes should pass through regexForm and get saved with the result under a trie the way they were defined. The aim is to skip this replacement phase during runtime
- only needed if you're using a lot of dynamic routes