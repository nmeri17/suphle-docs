#
Basics...Anatomy of a tilwa app

1) Adapters (ORM, Auth), libraries, configs, tests (integration, feature)
2) Adapter concretes, middleware, error handlers
3) Framework (routing, container, managers)
4) Controllers, events, requests
5) Services, repo (consume libraries, adapter concretes)
6) Tests (assert the two above)

Each level points inward to the one(s) below it

The typical module only interferes slightly at 2), then from 4) till the end

App enters at 3) and combines everything below it in order to produce a response

#
Then request lifecycle. Suphple requests embark on quite the eventful 
journey......

There are 3 different kind of requests, which are in turn, subdivided into 
their subcategories. We have login requests, flow requests, and regular 
requests

For regular requests, base objects (router, event manager etc.) 
instantiated after module initialization point is crossed take on a new dimension — one with 
context and purpose within its module. Mere autoload is no longer enough to 
fully grasp the classes intended objective without scope

#
Start out the common concepts simple, without assumption that dev knows 
what they are ie. Controllers are where the behaviour behind each endpoint 
is decided. Request objects are the way to intercept path placeholder and 
payload bodies. Route definitions are controller adapters; which means that 
for all the power controllers are known to wield, they are answerable to 
what 
is being dictated from route definitions. As will soon be seen with route 
collections, one can plug in various coexisting controller implementations 
as the need may be