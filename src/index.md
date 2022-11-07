---
home: true
heroImage: /suphle.jpg
tagline: Opinionated PHP framework for building performant, extensible, and testable web applications
actionText: Quick Start →
actionLink: /docs/v1/quick-start/
features:
- title: Building an architectural masterpiece?
  details: Modular-monoliths? Decoupled components? SOLID principles? Slim controllers? Conditional factories? If those terms appeal to you, their enabling structures are enforced in Suphle
- title: Intuitive DX
  details: Class names are preferred over aliases in all cases (labelling, payloads/DTOs, routing); for discoverability, lazy-loading, auto-wiring them, etc. Strongly typed config classes. There are no includes, no folder scanning, no instantiation is done prematurely (during booting or whenever)
- title: Infinite flexibility
  details: No hard-coded folder names. Dislike the default ORM? Swap it out in a heartbeat! Same goes for templating engine. Bring whatever components you're used to along. Even bring existing projects written in other PHP frameworks. Suphle will not object
footer: Made with blood and tears by Nmeri Alphonsus
---


---
# Introduction

Suphle is a PHP framework for enterprises and SAASes to build anything from robust APIs, to CLI programs and server rendered full-stack apps **without** compromising on the high fidelity expected of SPAs. It builds upon some of the [industry's most trusted](/docs/v1/database) components, but can equally get out of the way for you to insert libraries that make you feel more at home. Its recommended stack is STT (Suphle-Transphporm-Turbo)

## Performance
// insert missing image icon

If you're coming from the JS ecosystem, you must be itching to see whether Suphle has the longest bar among a row of competing contenders. By now, it should be common knowledge that if you're not building one of the FAANG companies, handling hundreds of thousands of requests per second should be the least of your worries.

Performance graphs compare frameworks/runtimes built for Hello World projects, or rudimentary apps making a very simple SQL query. These "educational" apps lack the context of a realistic project using an ORM to make dynamic, unpredictable or un-cacheable queries. That is not to discredit the value of speed. In Suphle, we use a trie-based router for quick failure, a RoadRunner server that's as close to a compiled language as it gets, and Flows for preemptively caching endpoints serving complex content.

Suphle has a number of objectives it advices you prioritize over speed benchmarks. That is:

- Building software maintainable by both minnows and those who didn't originally create it.
- Bridging the gap between developers who make best practices optional and those who don't -- standardizing them, if you will.
- Get developers who don't yet to take automated testing more seriously
- Deprecate error pages and responses.

Thankfully, PHP's ecosystem has matured enough to boast of  static type-checking tools to snipe out what can be classified as compile-time errorsand RoadRunner to attend to both fears. Suphle comes pre-built with these tools, although it can still handle requests in the traditional PHP fashion.

## How it's similar
In a broader sense, if you're coming from a framework written in another language, some features there parallel what is obtainable in Suphle:

- *NestJS:* Modules, @Transaction
- *Spring Boot:* Circular dependencies, decorators, interface auto-wiring, component/service-specific classes, @Transactional
- *Rust:* Macros, Result
- *Phoenix:* Livewire

It may interest you to know that some of these best practices were only found to intersect after Suphle was mostly complete rather than a premeditated attempt to build a chimera of widely acclaimed functionality. That is why in Suphle, their implementation details differ. For instance, Suphle's modules are wired/built differently. The rest of the documentation goes into thorough detail about how that, as well as other implementations you're used to were improved upon.

## How it's different
You may be thinking:

> I'm in too much of a hurry to sift through the entire docs in search of what captivating goodies Suphle has to offer, in concrete terms.

Let me spare you the hassle by listing topics I personally find compelling:

1. The routing system, guaranteed to be the most unconventional you've seen till date
1. Module descriptors and wiring
1. Flows
1. Testing framework to mock and verify behavior exposed by every observable functionality
1. The default decorators available
1. 3rd party framework bridge
1. Exception handling, testing, broadcasting
1. The controller layer
1. HTML templating

You can randomly check out any of them. But the APIs for everything else in Suphle is carefully designed to look marvelous; from events to middleware, outgoing and incoming HTTP requests. There's model-based authorization, authentication customization. Pair strategic design with functionality, and you have the doozy that your SAAS application will be.

Let's not forget: this is still Suphle's first official release. The idea is that when it's augmented by a community no longer burdened by the issues it currently puts to rest, it'll serve as springboard for the next level of engineering web and CLI based software.

::: tip
The love you have for what you build naturally reflects in the artsy attention paid to it. What if every thing could be built that way without the costly expense of tedium?
:::