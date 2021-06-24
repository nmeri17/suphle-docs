Docs
#introduction
Suphple (derived from the English word, "supple") is a php microframework 
that by default, ships with an mvvm paradigm 
for creating stateful web applications. It builds upon some of the 
industry's most trusted components, but can equally get out of the way for 
you to insert libraries that make you feel more at home. Its recommended 
stack is STT (Suphple-Transphporm-Turbo)


One of the differences that [link to #motivation] sets it apart from other efforts in the same 
category is the architectural changes it advocates: Domain Driven Design, 
modular architectures, decoupled components, SOLID principles, slim 
controllers, and service oriented architectures. If those terms appeal to 
you, Suphple might be worth giving a shot.

While building your projects with it, expect to often trigger custom 
events, extend your classes -- which could be anything from routes to 
controllers or services; in short, you'll be performing practices for 
frequently changing, dynamic, and testable web applications.

It equally expects such programs to be patronized by large traffic, and retain the performance of a typical hello world introductory tutorial. Going forward, integration with asynchronous frameworks is slated [link to roadmap] to commence any time in the near future, both in order to curb the concurrency concern and deliver responses at unbeatable speeds

#how does it compare against others?
Present performance benchmarks

#sustainability
Given the fact that Suphple is the framework of choice to power a number of 
long term projects currently in the works, there is no doubt that it'll be 
the subject of constant updates improving it both in the near and distant 
future

#Closing remarks
If you are yet to relate with any of these use cases and would like to have 
it looked into, do not hesitate to contact me to discuss what your 
requirements look like. But if you are curious to learn more concerning the 
details of this overview, well, welcome aboard!

I hope you enjoy the ride🚤

#quote
The love you have for what you build naturally reflects in the artsy 
attention paid to it. What if everything could be built that way without 
the costly expense of tedium?


##MOTIVATION
Despite the multitude of frameworks already existing, and the few globally successful ones, Suphple was created for purposes discussed below.

Programming language books teach its readers syntax and how to write code. Current frameworks implement common application features and structure them in ways that apply to a majority of use-cases. No current category of software caters to enabling its users maintain existing projects; only medium-to-advanced level articles assist in this regard. Maintaining software boils down to tests. With this in mind, it may be helpful if the next generation of development tools geared more towards enabling its users write code with the conscious aim of elegant extension or modification. This translates to a number of things:

	- maintainers need to understand that adding new features goes beyond simply changing existing methods or sprinkling new endpoints
	- product owners need to understand how indispensable tests are
	- developers ought to assume their successor doesn't know all the program's capabilities before they can confidently extend the project

Automated tests are at the heart of it all. No matter how many design patterns are followed to the letter, dreadful outcomes are inevitable in their absence. It's a little curious how their mere existence is so crucial to a product's quality, yet the end user is blissfully unaware of them. For this reason, developers are known to avoid them. The average developer's priority is to churn out as much features as possible in the shortest amount of time. The next generation of frameworks should assist in this crusade by vindicating the quality of what is being built before and during its shipment to production

In other words, Suphple's most important mission is for developers to create projects that don't break in production, because they are being properly maintained. Every other fancy terminology and core functionality is a means to that end. Dependency decoupling, auto-wiring, canary routes, flows; they are worth nothing if your program still responds in unexpected ways when it matters most

If you are visiting this page first before going through the rest of the documentation, those parts don't simply describe what functionality is possible, but delve deeper into what aspects of development require them

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

##CREDITS
Suphple was created by Nmeri Alphonsus, a software architect who has spent 
the last few years breaking and plumbing user stories at a fast paced 
startup. He is poised to build upon the foundations left behind by the 
present day web landscape, and leave the practice in a better state than he 
met it

Suphple is one of his efforts to transform potential technical debt into a 
palpable mass of lasting solutions. This documentation makes reference to 
the many review cycles (earlier 
drafts) required to determine how best to convey the author's intents and 
philosophies

If you want to reach out to crack open a feverish discourse concerning game 
of thrones, Lionel Messi, dank memes, some riveting software engineering 
concept or anything at all concerning Suphple, he will anxiously be waiting 
over at the mailbox. Or, if you're one of the cool kids, you can ping him 
on Twitter instead. Happy coding!


##CANARIES AND FEATURE TOGGLING
*jump to content/ interlude

An often encountered scenario is that of short-lived features implemented 
within our app, or perhaps, we're opening up a feature to a group of users. 
These are actually two distinct occurrences. The latter is an attempt to 
decipher which group of features eventually become integrated into the main 
application. The standard term for this is canary releases. On the other 
hand, the former involves temporary updates we want all users to utilize
The situation with canary releases is often solved at the deployment level. 
The devops engineers are looked upon to route a small subsection of random 
users to parallel instances of our project. But what happens to teams/ solo 
developers without access to complimentary devops members?

There are two common ways of globally managing feature states. The first 
one relies on a devops guy to deploy the feature branch (and revert to the 
main branch). The second approach follows reading the availability of such 
feature from a feature toggle file, a .env, database, or what have you

While these do work, we tend to leave behind dead code at the toggle points 
when we're no longer interested in those features. At times like this, our 
logic layer becomes cluttered with conditionals that will never run.

#
Canary releases should protect URLs under it from direct access, except 
users are authorized to be there. Thus, it makes sense for calls for user 
fetching is restricted to those matching criteria in the canary. This 
feature can equally be used when implementing gates

##ROUTING

Route methods PATH_id_EDIT_id2. Double underscore with all uppercase = 1 
underscore. One underscore = hyphen. Underscore before all uppercase = 
slash. Underscore before all lower case = placeholder
PATH_foo_EDIT_bar0 // the 0 trailing bar makes it an 
optional parameter?

Request is null inside route permissions but is available in the service 
permissions method

#
While it's neater to initialize renderers in a collection's constructor, 
since only one would get used, considering methods aren't evaluated except 
their pattern matches, instantiating new ones pays off in the long run

#
Api endpoints are backwards compatible. Backwards, then compatible. We need 
the given version of a path. If it isn't specified on this version, we look 
for it on the previous version, recursively
Lazy loading the route classes on demand

In the route register
BrowserRoutes = // calling api mirror on those classes populates below 
object, while preventing routes we only want to have gui routes from 
getting in there

ApiRoutes = [V1 => this->browserRoutes(), v2 => classB ] //

1) request comes in for v1, we skip v2 
2)  v2, we slice the array from v2, and load backwards till a match is 
found 

#
The routes are loaded into arrays keyed by the last slash ie. Routes under 
/store go into an array. If the incoming url doesn't match that base path, 
we avoid delving deeper to parse

You don't have to Extend api route collections. we're not reading its 
parents automatically from a numerically indexed array of versions cuz it 
won't be immediately understood by a human reader

##REQUESTS

Set payload should only work with predefined properties

While it may seem daunting to create custom request objects, recall that 
Applications 
crumble when its user is allowed to do unexpected things. It always pays 
off when their every move is anticipated in the sandbox of a custom class

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

Flow request uses a pub sub pattern ie. Publishing to all flows containing 
outgoing route (same way we pick event external handlers). Furthermore, 
each write to the redis data store by a queried database result set 
subscribes to that topic. Each write to the database looks up subscriptions 
matching the criteria

##MODULES

#Preamble: the modular philosophy
One of the great dividends of building opinionated structures is that it 
solves the architectural problem for its eventual user. With that out of 
the way, they are left to think in services -- isolated, exportable 
micro-units of logic. Think of it as a design system for back ends. Every 
mature design system has a user-contributed gallery of components 
conforming to its principles. /That/ is one of the eventual dreams with 
Suphple; that 
projects can be commenced and executed with the aid of extended, freely 
available 
domain-specific business-oriented micro-dependencies, with nearly identical 
coding styles

configuration passed into Modules should be assigned to instance level 
properties. Inside the relevant service provider/config, the module will be type 
hinted, and the value lifted

Each module should have its own vendor folder i.e. None at the root

#when to create a new module
While there are an infinite number of factors deciding when part of an 
application should gain autonomy, a few are logical. But there's no 
standard cast in stone — only a few general rules of thumb. One obvious 
indicator is them having the same route prefix. As for unrelated concepts, 
It is usually safer for them to start out as separate modules dependent on 
each other, and only be merged into one when the interactions between them 
becomes more than trivial. If module A's controller is dominated by calls 
to different services borrowed from a module it depends on, it could mean 
they belong together

Look at methods on the module file

##EVENTS
A criminally overlooked part of back end engineering. Suphple would 
restrict 
all read/write database operations to be only executable within the context 
of a specific side-effect event handler. But for the sole purpose of 
commands whose producers are more optimized with synchronous responses, 
such imposition was left to the developer's discretion. A fine example 
being our module sending a create event for a related model within the 
boundaries of another module

One line of defense against this obstacle advocates against the use of 
relational models in service oriented architectures. A less drastic opinion 
suggests making use of guids instead of auto incremented ids. Whatever 
design decision is made based on these considerations, events are expected 
to be an important part of it. Pay attention at seams for operations whose 
results are of no importance to the response

Mention event cascading

##QUEUES
Events are a direct precursor to queues. Think of them as deferred events. 
If events are a way of extracting unrelated code from visual flow and 
opening up code for injecting and extending, queues are a way of delegating 
the event bootstrap and invocation process
While it may be tempting to defer events and functionality, beware of 
business requirements making it unrealistic to dispense value without 
awaiting completion of an orderly sequence of activities

##LARAVEL INTEROPERABILITY
If you are sold on Suphple's features already but remain reluctant due to 
your missing favourite laravel library, there is cheering news. There's no 
need to feel left out, because chances are your dependencies will still 
work as expected*

One of laravel's most notable features is in its extensibility and 
tremendous flexibility. What this means is that its regular booting process 
can be hijacked and replicated within foreign territory

But as a package developer, don't get carried away into building new 
laravel packages just because they are cross platform. The process of 
booting a laravel application instance in the background is an expensive 
one whose specific cost can be calculated by how demanding the package 
being provided is. Packages registering views, routes, and configs 
typically cost more those that register only one of those

Beyond that, care is taken to prevent procedural helper functions that may 
be present in those packages from leaking into your app. This 
responsibility comes with its own overhead

In summary, it works, but should be used as band aid for Suphple's current 
lack of packages

#
User plugs in their service providers in a laravelProviders array labelled 
by the class in the provider's register method. Then, we kind of imitate 
the same functionality of registering routes, views etc within our own scope

In order to prevent facades being used in place of real object names, there 
is another verification to ensure instance name matches A's request

*Another reason the package may not work is if it's a Laravel plugin i.e. 
seeks to replace laravel core functionality such as the router, or more 
appropriately, interfaces that don't exist on Suphple


##TESTING

Tests are always ordered last in both books and framework documentation, 
because they don't contribute directly to what end user interacts with. This approach creates so many developers who either don't know how to automate their tests, or lack 
the time to do so. It takes the few who have seen first hand through the 
crystal ball of tests, to appreciate how indispensable it is. It is the 
only insurance that can give a code maintainer the confidence required to 
alter existing code without fear of damaging other parts of the system. It 
equally forms the basis of the bravery behind presenting features meeting 
up to business needs.

Much can be said about providing methods for making testing easier, but 
very little is said concerning the key thing which is coding standards 
these methods can be properly applied to. A good, opinionated framework 
guides its users towards achieving this, rather than leaving them to devote 
their time to studying such arts

While TDD advocates may attempt to downplay the tedium of tests, in 
sincerity, it takes careful commitment to get right. It generally entails 
stubbing method calls, database seeding, mocking object states, and 
expecting certain outcomes, which is the part we are ultimately interested 
in. But putting it all together is what distinguishes a codebase one update 
away from disaster, from another

Now that we have a solid grasp of the gravity of tests, we may move on to 
what techniques Suphple provides to aid its developers on this voyage

Non TDD activists can run php Suphple testgen. With that nifty command, 
they 
get a bumper package of feature tests, integration/http tests, unit tests, 
happy and sad path test cases out of the box!

There may be some criticism surrounding a program's knowledge of written 
software. And to be honest, it's a valid argument. Only the developer has an 
exhaustive business knowledge of his software's intricacies. Suphple merely 
tries to help, by applying heuristics derived from all valid sources fed to 
it

Tests offer confidence when shipping new code but at the cost of additional 
time and effort. Generated tests are not direct replacement for developers 
testing their applications in quirky ways unpredictable at scale. But it 
seeks to leave only edge case tests to the developer
It mostly works under the premise that the developer adheres to immediate 
implementation of business requirements rather than TDD


##SERVICES AND CONTROLLERS
While decisive steps are put in place on controllers to drive the point of 
micro services home, the onus of writing atomic services lies in the 
developer's 
hands. It is up to you to recognize and extract recurring patterns or 
behaviour in your services into individual private methods

#
Validating dependencies at runtime may raise some eyebrows, especially when 
there are less on-demand solutions such as validating the code base after 
each update. It is assumed that the barrier for syntax memorization is so 
low, any beginner can get in — junior developers who should not be trusted 
to 
know what they're doing. In exchange, the cost of validation is a few micro 
seconds in performance. If it's either not a price you are willing to pay, 
perhaps out of trust in your abilities and that of your colleagues, the 
controller configuration setting method "validates" should return false

#
Super classes aren't returned when consumers try to pull their sub classes 
because there's simply no way for the consumer to know a sub exists. 
However, providing base classes can be served to a known type of consumers. 
To illustrate, consider (convert this to code) X is a sub-class of Y, B is 
the sub of A

1) A pulls X --> only works if A provided X
2) B pulls Y --> works if A provided Y

Scenario 2 is useful when a variable group of classes with a base type need 
to provide an immutable or unchanging instance
In order to achieve scenario 1, convert Y to an interface and provide X as 
an implementation

#model hydration

<?php
function jj (NewsRequest $request, ControllerModel $newData) { // conceals 
News::where(id, id) stored on property x

        $this->newsRepository->updateJj($newData, $request); // cleaner. 
gets are lazier and under developer's control. avoids duplicating builders
}

#Logic Factories
For adequately testing all possible use cases, alternate flow paths 
(control flow, not Suphple flow) must be visited as well. At each endpoint, 
we dive deeper by testing its range of output. By using a declarative 
syntax, we're able to able to inform the framework this is an alternate 
path of execution, we try to fulfill that condition and test it as well.

See https://pastebin.com/8idvNsyu

##CONTRIBUTION GUIDELINES
It is emotionally uplifting that you feel compelled to take time out of 
your schedule to invest in what makes Suphple tick. However, the 
breathtaking 
improvements you are bringing on board will be better received if it meets 
a few non-negotiable criteria. This is not to say your modalities are 
inaccurate, but it's an attempt to ensure a consistent, homogenic 
fundamental code style.

First and foremost, there is no need for includes or requires anywhere. 
Traits should be avoided in favour of object composition/aggregation. "Magical" 
behaviour such as facades should be kept at arm's length. If you have to 
decide between creating a fairly attractive API, and performing arcane 
actions that obscure intuitive use of the language, sacrifice the beautiful 
API. It doesn't pay off in the long run when new persons are battling to 
grasp how things work

Functions/closures should be avoided at all costs. They either violate the 
include rule or live in global scopes that bring ridicule to this great 
language

Even when attributes are implemented as a core language feature, avoid the 
temptation to support route definition in files. While it provides an 
opportunity for co-locating endpoints and their corresponding handlers, it 
quickly becomes undesirable when the need for tracing an endpoint arises 

Prefer creating DTOs over using associative arrays

That's it. If we are in agreement, we can then examine features on the roadmap or discuss something new not there yet


##CONTAINERS
Container pages are not the kind typically visited while perusing 
documentation. However, understanding what can be achieved with Suphple's 
container promises to pay huge dividends in the long run. But first of all, 
what is a container, and what does it "contain", anyway?

At the most basic level, they are object caches — you store object 
instances in them so you don't instantiate multiple versions of the same 
class and have them running all over the place. As applications grow more 
complex, we look onto them to fulfill needs beyond just object caching

Containers are the missing feature of every back end language. They are 
associated with making concretes out of interfaces but take care of other 
details such as hydrating and wiring arguments. One characteristic of a 
good back end framework is that its container is both versatile and 
powerful enough for the developer to never pull objects out of it directly

For the dynamism and OOP flexibility Suphple programs are expected to have, 
developers should not shy away from actively interacting with the 
container. The framework itself heavily relies on it to achieve the modular 
architecture.

With that said, we will look at what arsenal it offers its users

Container->spaceNeedsFrom: Doesn't make services implementing interfaces 
strictly required. Useful while maybe refactoring from one service 
implementation to another, on a scale spanning multiple controllers

Modules\CartModule\Controllers\CarController
Modules\CartModule\Contracts\ICarService // or CarService
Modules\CartModule\Services\CarServiceImpl //


#Handling circular dependencies
These are usually a code smell. Which is why most containers crumble when 
these are thrown at them. Logical flow ought to be composed in a 
hierarchical manner that expresses the lower level elements as entirely 
oblivious of their higher level counterparts. Service return values should 
be collated at a central point such as the controller and sent to 
evaluating service. Such situations are usually an indication that some 
part of those services should exist on their own. This enriches the 
application with a decoupled dependency chain, and by extension, 
testability

That said, "tell, don't ask" principle may appeal to some, and services can 
wind up in the constructor of their own dependencies. For instance, it may 
be undesirable to retrieve values from service x and plug into y (show 
example of chatty controller). In such cases, Suphple's container handles it using an otherwise, primitive implementation of class templates/generics/decorators

class A {

    function __construct(B $foo) {
        dump($foo);
        // $this->foo = $foo;
    }
}

class B {

    function __construct(A $foo) {
        dump($foo);
        // $this->foo = $foo;
    }
}

##SERVICE PROVIDERS
Service providers are classes used by the framework to bind concrete 
instances to its interface. If that sounds familiar, that is because it was 
mentioned in the entity binding section of the module descriptor page. 
Indeed, both have a similar function, their only difference being that 
service providers offer additional room for "booting" the newly created 
instance

What methods do they contain? Who do they extend? They don't work on super 
classes

Developers coming from laravel may expect to see more details concerning 
the introduction of external libraries through this medium. However, 
Suphple 
differs in that such tweaks are achieved by means of configuration classes 
and modules

For instance, one who intends to do x might be better off...

Explain how here or link to those pages


##AUTH
*Login request
        - matches config login route? pick config login service and attempt 
login
        - set this service as the renderer controllers
        - depending on a)'s result, one of b)'s renderers are executed
        - executioner expects to receive an AuthStorage that determines 
whether it's session or jwt request is getting back


#Review this
Request for auth route comes in:
        - depending on the authentication type (jwt/session/custom ), user 
id is retrieved
        - this id is forwarded to a reliable person accessible to 
controllers/request/container who are interested in retrieving auth user
        - in the background, he receives a concrete orm from any container 
available and can hydrate a user out of the id he was given
        - he is also overwritable in case dev wants a custom way of user 
hydration
        - he's the one responseManager interfaces with and decides a user 
is unauthenticated when his id is missing


##AUTHORIZATION
Authorization is divided into two categories: route based protection and a 
entity/model based approach. Of the two, the latter is both more flexible and 
more powerful. With it in place, you will have little use for its 
counterpart.

Route authorization occurs at a high level covering routes below it. But 
its utility shines better for paths that don't interact with the underlying 
database. Routes computing data or communicating with external clients are 
encouraged to be protected at the route layer when they grant access to 
privileged users
...
Authorization is often wrongly relegated to being used for restricting 
access to administrative dashboards. However, their usefulness transcends 
that. 

Every resource created by authenticated users is usually stored with a 
reference to its creator —posts, comments, products, and what have you. In 
most applications, we want to restrict CRUD access of such resources to 
their creator. The risk of merely receiving resource identifiers for the 
currently logged in user implies they can violate the privacy of other 
users by simply transferring identifiers to their resources over the wire

By securing them at the model layer, one can be guaranteed that those 
resources are constantly in the safe hands of their creator, site 
administrator, collaborator, and the application's developer. Without such 
contraceptive in place, new additions to a team, implementing new features, 
will either need to be aware of existing authorization rules for those 
resources, roll out a new one, or worse, expose them to the whole world!

It equally provides the added advantage of centralizing module rules to 
where one can quickly glance at available permissions for each resource


##A WORD ON MICROSERVICES
One notable edge microservices have over modular monoliths is in the way internal services can be scaled behind a load balancer. This is for applications seeking to cater for expanded activity on specific parts of the bigger picture. It's a limitation monoliths simply 
cannot afford due to the nature of their deployment

aka if you have no need for this, don't bother going that direction

##MIDDLEWARE
Since routes are being composed down tries, route collections middlewares 
should contain references to what pattern method they are bound to.

We only need middlewares to transform response or request objects over a 
group of action handlers

They're bound to the collection, not the renderer

How do we pass arguments to middleware from their definition point? How do 
I register global middleware that runs on all requests?


##PLUGINS
Our emphasis on decoupling means domain module authors are encouraged to build 
around standardized interfaces for decreased coupling. A sample library is a module 
whose exports class must implement the library for the category it belongs 
to. For instance, paystack library implements the payment gateway module. 
In the consuming module, we define Suphple payment gateway interface as one 
of the depends, and plug in paystack or flutterwave libraries in the provider

You can either have libraries giving new functionality to the developer or 
those overriding default framework behaviour. For the latter to be 
possible, we have to operate with interfaces, load our own implementation 
during boot, and pull them from the container.
We can either do this everywhere or at positions we intend leaving open for 
extension such as the object that boots controller arguments
The difference between both is that packages/libraries are framework 
agnostic. Or at least, they are meant to be. They ought to rely on language 
constructs for implementing functionality. Plugins on the other hand, are 
for replacing existing 
functionality in the framework

Doc readers want to know what classes are overridable
