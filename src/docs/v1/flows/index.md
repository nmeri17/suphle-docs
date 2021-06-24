##FLOWS
Flows can be thought of as short lived caches preemptively fetching all of 
a user's possible requests in the background. Due to this temporary 
intention, they aren't updated when their original content changes on the 
database*

*although there is an open issue to the effect

#
Without prefetching/flow testing, it's safe to leave in the side effects in 
your controller. Otherwise, the data layer for get queries shouldn't 
contain side effects. Side effects for an route named "product/fetch" 
should trigger an event with either the route name or action method as 
event name

#
Flow request takes arguments informing it
1) all possible routes user can visit next from here
3) what parameters we're fetching ie. Instead of prefetching all products, 
we could instruct it to prefetch on products returned in the previous 
response

#
Post request can't make optimistic fetches because they're expected to be 
validated

##

Flow request uses a pub sub pattern ie. Publishing to all flows containing outgoing route (same way we pick event external handlers). Furthermore, each write to the redis data store by a queried database result set subscribes to that topic. Each write to the database looks up subscriptions 
matching the criteria

random update