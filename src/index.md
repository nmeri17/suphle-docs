---
layout: Home
home: true
heroImage: /logo.svg
tagline: Opinionated PHP framework for building performant, extensible, and testable web applications
actionText: Quick Start
actionLink: /docs/v1/quick-start/
features:
- title: Unprecedented integrations
  details: Side-loading projects written in other frameworks. Overridable, versioned API routes automatically derived from existing browser paths. Load-balancer. Static-checking. Predefined type-dependent architectural rules. Websockets. Parallel testing 
- title: Intuitive DX
  details: Modular-monoliths. Class names are preferred over aliases in all cases (labelling, payloads/DTOs, routing); for discoverability, lazy-loading, binding them, etc. Strongly-typed config classes. There are no includes, no runtime folder scanning, no instantiation is done prematurely (during booting or whenever), no statics, magics or globals
- title: Infinite flexibility
  details: No hard-coded folder names. Dislike the default ORM? Swap it out in a heartbeat! Same goes for templating engine. Bring whatever components you're used to along.
footer: Made with 💉 and 😰 by Nmeri Alphonsus
---

## The Suphle you ordered is here!

Suphle is a sophisticated PHP framework for enterprises, startups and SAASes to build anything from robust APIs, to CLI programs and server rendered full-stack apps without compromising on the high fidelity expected of SPAs. It builds upon some of the industry's most trusted components, but can equally get out of the way for you to insert libraries that make you feel more at home. Its recommended stack is SBT (Suphle-Blade-Turbo)

## Performance

![](/image-not-found.jpg)

If you're coming from the JS ecosystem, you must be itching to see whether Suphle has the longest bar among a row of competing contenders. By now, it should be common knowledge that if you're not building one of the FAANG companies, handling hundreds of thousands of requests per second should be the least of your worries.

Performance graphs compare frameworks/runtimes built for Hello World projects, or rudimentary apps making a very simple SQL query. These "educational" apps lack the context of a realistic project using an ORM to make dynamic, unpredictable or un-cacheable queries. That is not to discredit the value of speed. In Suphle, we use a trie-based router for quick failure, a RoadRunner server that's as close to a compiled language as it gets, and Flows for preemptively caching endpoints serving complex content.

Suphle has a number of objectives it advices you prioritize over speed benchmarks:

- Building software maintainable by both minnows and those who didn't originally create it.
- Bridging the gap between developers who make best practices optional and those who don't -- standardizing them, if you will.
- Get developers who don't yet to take automated testing more seriously
- Deprecate error pages and responses.

Thankfully, PHP's ecosystem has matured enough to boast of  static type-checking tools to snipe out what can be classified as compile-time errors and RoadRunner to attend to both fears. Suphle comes pre-built with these tools, although it can still handle requests in the traditional PHP fashion.

## How it's similar

In a broader sense, if you're coming from a framework written in another language, some features there parallel what is obtainable in Suphle:

- *NestJS:* Modules, @Transaction
- *Spring Boot:* Circular dependencies, decorators, entity binding, component/service-specific classes, @Transactional
- *Rust:* Macros, Result
- *Phoenix:* Livewire

It may interest you to know that some of these best practices were only found to intersect after Suphle was mostly complete rather than a premeditated attempt to build a chimera of widely acclaimed functionality. That is why in Suphle, their implementation details differ. For instance, Suphle's modules are wired/built differently, our transaction decorator does more than just transactions, and so on.

The rest of the documentation goes into thorough detail about how that, as well as other implementations you're used to were improved upon.

## How it's different

You may be thinking:

> I'm in too much of a hurry to sift through the entire docs in search of what captivating goodies Suphle has to offer, in concrete terms.

Let me spare you the hassle by listing topics I personally find compelling:

1. The routing system, guaranteed to be the most unconventional you've seen till date
1. Module descriptors and their wiring
1. Flows
1. Testing framework to mock and verify behavior exposed by every observable functionality
1. The default decorators available
1. 3rd party framework bridge
1. Exception handling, testing, broadcasting
1. Service-coordinators

You can randomly check out any of them. But the APIs for everything else in Suphle is carefully designed to look marvelous; from events to middleware, component-templates, outgoing and incoming HTTP requests. There's model-based authorization, authentication customization. Pair strategic design with functionality, and you have the doozy that your SAAS application will be.

::: tip
The love you have for what you build naturally reflects in the artsy attention paid to it. What if every thing could be built that way without the costly expense of tedium?
:::

## How reliable it is

The iteration of Suphle released for public use has been in the making for at least 3 years, with 2 of out of that demanding full-time devotion. It's not farfetched to assume that that is enough time for it to have been rigorously tested and refined to withstand most realistic conditions. Should any need or bug have escaped internal usage, you can label the StackOverflow tag, `suphle`, on [your question](https://stackoverflow.com/questions/ask). If it's unexpected behavior, or that which deviates from specification on this documentation, kindly attempt to reproduce it on the [Github repopository](https://github.com/nmeri17/suphle/issues/new/choose).

[Ready to get started?](/docs/v1/quick-start)
