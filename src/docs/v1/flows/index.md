# Flows

## Introduction
In a nutshell, Flows are performance-enhancing preemptive caches. It differs from traditional caching in the sense that the latter requires an initial user to warm the cache of that particular content. This drawback implies it's not applicable to apps where that next visit should be unique, or appear dynamic in nature. Flows tend to salvage these constraints by caching the request for that user where necessary even before they make the request.

For instance, suppose an author visits their catalog, the app should anticipate their next request will defintely be to one of their books, loads them ahead of them to create the illusion of a static site.

Due to their inherently temporary nature, they aren't updated when their original content changes on the database, although this may be reviewed in future

#
Without prefetching/flow testing, it's safe to leave in the side effects in your controller. Otherwise, the data layer for get queries shouldn't contain side effects. Side effects for an route named "product/fetch" should trigger an event with either the route name or action method as event name

#
Post request can't make optimistic fetches because they're expected to be validated

##

Flow request uses a pub sub pattern ie. Publishing to all flows containing outgoing route (same way we pick event external handlers). Furthermore, each write to the redis data store by a queried database result set subscribes to that topic. Each write to the database looks up subscriptions matching the criteria

The default mechanism on the first container will be used When hydrating and comparing user instance during the flow request. The framework doesn't bother checking what mechanism was attached to the organic equivalent of the route. When this is not desired, you can always thwart it through the first module's `bindEntities` (I think) method

// show example that uses requestDetails to check if request belongs to api and serves TokenStorage