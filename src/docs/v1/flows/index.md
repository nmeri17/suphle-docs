# Flows

## Introduction
In a nutshell, Flows are performance-enhancing preemptive caches. It differs from traditional caching in the sense that the latter requires an initial user to warm the cache of that particular content. This drawback implies it's not applicable to apps where that next visit should be unique, or appear dynamic in nature. Flows tend to salvage these constraints by caching the request for that user where necessary even before they make the request.

For instance, suppose an author visits their catalog, the app should anticipate their next request will defintely be to one of their books, loads them ahead of time to create the illusion of a static site.

Due to their inherently temporary nature, they aren't updated when their original content changes on the database, although this may be reviewed in future (Link to PR)

#
Without prefetching/flow testing, it's safe to leave in the side effects in your controller. Otherwise, the data layer for get queries shouldn't contain side effects. Side effects for an route named "product/fetch" should trigger an event with either the route name or action method as event name

#
Post request can't make optimistic fetches because they're expected to be validated

## Authenticating users
The default mechanism on the first container will be used When hydrating and comparing user instance during the flow request. The framework doesn't bother checking what mechanism was attached to the organic equivalent of the route. When this is not desired, you can always thwart it through the first module's `bindEntities` (I think) method

// show example that uses requestDetails to check if request belongs to api and serves TokenStorage

## Flow expiration
There are two factors that determine how long or how much a flow can be accessed: one is the `maxHits`, while the other is the `expiresAt` properties set on the flow instance

// show config example

`maxHits` determines how many times a resource should be accessed before thrown out of the cache. By default, the value for this is 1. `expiresAt`, on the other hand, determines how long we want the resource to be stored. This property, however, supercedes `maxHits`. 

// show example with more maxHits that has been wiped since the expiry date has been reached

When a flow url is ineligible for access, it is being cleared from the storage. However, note that only the accessed content is cleared. Other cached items in the series remain intact until their own configuration sees to their exit

// example, maybe?

# Flow types

Flows are sub-divided into two types:
- Those that deal with single value nodes, known as Single Nodes
- Nodes that contain a list of data (such as database entities), known as Collection Nodes

In both cases, the idea is to reach into the previous response with a key matching one of those returned from that payload. The value at this key will determine whether it is a single or collection node. The key can either be the actual key name:

// example

Or, can narrow down to a property on that node using dot notation:

// example

Where applicable, the dot notation can equally be used when setting the handler for the flow type. Each of the handler methods return an instance of the flow type for fluent chaining, although the high level methods will likely deliver for most use cases

// example

## Single Nodes
These are handlers available by calling `$flow->previousResponse()->getNode`

### - `pipeTo()`

## Collection Nodes
These are handlers available by calling `$flow->previousResponse()->collectionNode`

### - `pipeTo()`
`RequestDetails` is then populated with the resulting value, on a key that matches the leaf name assigned during instantiation of the collection flow

// example