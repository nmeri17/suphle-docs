## Introduction

As a wise friend once put it, "the devil is in the maintenance. Don't assume knowledge about the full cost of a thing until you understand what maintaining it entails,". Projects built by single developers from the comfort of their basement can withstand any level of change over the years since the author knows where everything is and may not be the best judge of the code's quality or stability. Bigger projects with multiple contributors require a conscious effort to cushion the diversity of ideas such that each competent member can replace parts of the code they met while keeping the contraption running smoothly, as though it were one uniform block.

In this chapter, we'll be looking at strategies for the new addition to dovetail the way it would have, had it been planned along with the original structure. It assumes an already firm [grasp of test automation](/docs/v1/appendix/Building-blocks-of-the-testing-chain).

## Team synchronization

Irrespective of the hierarchy information propagates between the developer and the client, one of the earliest steps to take before committing a line of code to the text editor, is to ensure you have a shared understanding of what the requirements are expected of you, with the stakeholder.

Depending on scope and level of complexity, it may be necessary to request for more clarification than is stated on the document. When this is the case, don't hesitate to ask as many questions as needed to remove ambiguity. Consider it your part to play in ensuring you are both on the same page.

If the back or front end is developed by multiple engineers, it's more beneficial to define a chain of command for orders to flow through. While all team members should accelerate towards the same vision, they ought to prioritize the steps that will lead to those goals and religiously adhere to them. This will cause working conditions to be standardized such that contributors don't publish conflicting updates or whimsically take on any part of the project they deem fit.

## Calculating delivery schedule

Most professionally executed projects will require the engineer or the handling company to agree with the client on a date the project is to be delivered. This section aims to assist in estimating what time to provide the client.

One-off projects such as those handled while freelancing don't really hurt the engineer's reputation when delivered behind schedule. But every employer or staff in a leadership position will rightly tell you that repeatedly defaulting on agreed schedule attracts stigma and casts doubts on the engineer's competence. This means that whatever duration you eventually give should be padded with enough room for you to deliver a quality product or feature, as the case may be.

The duration should not be too short, in the hopes that you should move fast and refactor later. The technical debt created under the influence of an impatient business is hardly ever paid off down the line. It is expected that at this point, you have understood the requirements expected of you and ironed out their technical details.

Assess the scope of impact implementation of the requirement will affect. This will determine what classes, if any, to extend or modify, what new ones to write, what events may be fired, what tests would certify completeness, high level details. You should be able to extrapolate from past experience how long it'll take to replicate that quantity. If it's your first time, you can give them a rough estimate but start timing yourself from now.

### The ditch of distraction

More often than not, you will be making maintenance estimations rather than those for building new systems. The main drawback that traps developers into falling behind their own schedules is distraction. Any activity that doesn't directly pertain to what you set out to do can be considered a distraction:

- If you're yet unfamiliar with a large project, it could take some time to locate entities, their meanings and relevance to your inclusion.

- The parts of the project relevant to your change may be riddled with long-standing errors impeding your addition. These must either be fixed or discarded if the business no longer has use for them.

- Depending on the code you meet, the project may be in dire need of a refactor before you set foot in it. Some engineers are not bothered by such inconveniences while others are quite susceptible to the menace.

If any or more of these distractions are in the way, their resolution must be included in the timeframe it'll take to implement the change itself.

Refactorings, for example, should not be prioritized over the new addition. That sprint is for implementing some task and should be devoted to that, only. If you find it difficult to tolerate hideous codebases, you're advised to develop a temporary thick skin towards the area that concerns you. Find a way to complete, test, and deliver your task before revisiting those portions of the project for refactoring; otherwise, this setback must be communicated to your superiors while estimating duration of your implementation.

Some solutions to work around your hitches include extending involved collaborators, and repurposing relevant parts without the chatter getting in your way.

## Initial build guidelines

Even though this document is mainly focused on the maintenance phase of a software's lifecycle, there are some guidelines to take note of during its original construction that will aid in its subsequent maintenance. These decisions are crucial in determining both resilience and malleability of the system to change. The benefits of observing proper practices are not immediately felt during this phase, but further down the line when project demands deviation from its original requirements. An inexhaustive list of recommendations are enumerated below:

1. The most remarkable and non-negotiable of all advice is for project to be covered by automated tests before it can be considered complete and delivered to the client.

1. User-facing projects with the goal of future maintenance ought to observe the event-for-non-fetches rule to the letter. This affords new inclusions the ability of being tested independently without tampering, and as such, risking breaking the existing system.

1. Project should be architected into domain-specific silos. Such granular structure (sometimes referred to as *screaming architecture*), facilitates erasure of confusion for new project contributors, as well as focuses their attention to portions relevant to their incoming modification.

After putting these in place, we hope to have laid foundations for the project's longevity.

## Modifying existing systems

Some of the guidelines that govern fresh development equally intersect with those recommended for use when introducing new changes. These steps are to be followed sequentially, with some fortification in-between:

1. Arrange or organize your modification properly in their own folder. In a module-based system like Suphle's, that would be represented as unique [feature folders](/docs/v1/routing#Feature-toggling) in each module that the incoming change cuts across. While all requirements for the feature can still be tested in isolation, we can centralize our mocking logic for components under that domain who likely share similar dependencies.

1. The contents of this feature folder must be tested thoroughly.

1. When it comes to integrating the new addition with existing work, interfaces should be preferred over concretes. This offers the flexibility of testing your part of the project without depending on or being slowed down by collaborators in a dysfunctional or incomplete state. The subject of integration is a delicate one that should be looked into in greater detail.

### Integrating adjustments into existing systems

After implementing our shiny new feature, modifying or refactoring an existing one, the software is bound to break. Have no doubt about it. To be fair, the odds are not entirely 100:0, but they're so negligible that it's more realistic to simply round it off. Your only hope of turning the tide in your favor is by testing the system afterwards. There are multiple methods to test stability and integration of our modifications to the system, depending on [the manner of change being effected](#Fixing-a-broken-integration).

We mentioned earlier the usefulness of the event-for-non-fetches approach from the [onset](#Initial-build-guidelines). The caveat to this rule is that it only applies under situations where we're not modifying existing behaviour itself but only augmenting it. When the motive is to replace existing behaviour, we have to either [extend](#Extending-and-integrating-existing-parts) or modify the existing system, depending on intended longevity of the modification. In any case, the fresh addition should be tested in isolation to guarantee it functions as intended before its integration into the system (using `whenTypeAny()` or any other [binding mechanism](/docs/v1/container#Putting-objects-into-the-container)). Afterwards, the entire test suite should be run and pass, as a stamp of stability.

Don't change numerous parts of the system haphazardly so as not to render it unrunnable. A *system* here, can refer to a module or group of collaborating classes that form an integration test. It can be tricky to edit them coherently, considering how intertwined implementation of real-life features can be. That's where our [isolatory tactics](/docs/v1/appendix/Transition-from-visual-to-automated-testing#unit-isolation-strategies) should come to play. They ought to enable incremental modification while maintaining system stability. With the aid of doubles and extensions, you should be able to break the bigger picture into smaller units by its Areas of Impact. Implement all requirements for each constituent from its little corner, without leaving system worse than you met it, or losing the ability to test that AoI independently.

### Extending and integrating existing parts

As we said earlier, class extensions should be used when working on short-term replacements of current functionality. This distinction is suggested over the blanket recommendation to use feature branches. Since they're expected to be short-lived, their co-existence will not incur any maintainance overhead.

That said, don't modify a dependency to suit the needs of one of the new additions being introduced to avoid the risk of breaking already consuming clients. Always build an abstraction around that dependency and bind to that. It's this abstraction that is synchronized with its previous edition, tested, before being linked to both old and new clients.

This systematic integration works under a similar premise to [API versioning](/docs/v1/routing#API-collection-stack) i.e. the principle that clients should always be able to trust the dependency currently working for them. The project should continue on the stable path it was met while the new additions are being tested in isolation for correctness and compatibility with clients before its integration.

To illustrate, let's assume we have a Coordinator that simply invokes a service to perform an action:

```php

$someResult = $service->doXToProduct($builtProduct);
```

```php

class BusinessService extends UpdatefulService {

	public function __construct (protected readonly XBusiness $xBusiness) {

		//
	}

	function doXToProduct(BaseProductBuilder $builtProduct) {

		$a = $this->xBusiness->thingA($builtProduct);

		return $this->xBusiness->otherThingB($a);
	}
}
```

```php

class XBusiness {

	public function __construct(

		protected readonly DpDUtility $someDependency
	) {

		//
	}
}
```

All is well and fine, until the business department dictates that `doXToProduct` should only occur conditionally. At the high level, our action method is modified as follows:

```php

if ($this->payloadStorage->keyHasContent(self::X_KEY))

	$someResult = $service->doXToProduct($builtProduct);

else $someResult = $service->doYToProduct($builtProduct);
```

```php

class BusinessService extends UpdatefulService {

	public function __construct (
		protected readonly XBusiness $xBusiness, 

		protected readonly YBusiness $yBusiness
	) {

		//
	}

	function doXToProduct (BaseProductBuilder $builtProduct) {

		$a = $this->xBusiness->thingA($builtProduct);

		return $this->xBusiness->otherThingB($a);
	}

	function doYToProduct (BaseProductBuilder $builtProduct) {

		return $this->yBusiness->oh($builtProduct);
	}
}
```

The challenge arises when in order to reach its goals, `doYToProduct` adjusts `DpDUtility`, dependency commonly shared with `doXToProduct`. In order to protect its consumers from breaking while work on `doYToProduct` is in progress, `DpDUtility` should be converted to an interface, thereby making it flexible to [inject relevant implementations](/docs/v1/container#Explicit-method-arguments-context) -- in this case, `XBusiness` continues to rely on the current `DpDUtility` until it's considered safe for it to catch up with the extension.

```php

class XBusiness {

	public function __construct(

		protected readonly DpDUtilityInterface $sharedDependency
	) {

		//
	}
}

class YBusiness {

	public function __construct(

		protected readonly DpDUtilityInterface $sharedDependency
	) {

		//
	}
}
```

### Fixing a broken integration

In preceding sections, we have discussed conditions under which code should be replaced or extended. Over the course of our new inclusion, some existing tests may break either because the code they verified was replaced or the test itself no longer reflect currently implemented, desired functionality. This will then inform our reaction either in the failing test, on the dependency, or its consumer.

If we don't want to retain the current behaviour, the test must be brought up to speed with the changes effected on the latest additions. If the existing code failed because of an incompatible API, we want to find a common ground between the new and old systems. Rather than unifying their signatures into a longer list of arguments, the method being dependend on may have to be separated into two distinct methods that trigger an internal, common process.

If the behavior's replacement is replacement is permanent, the test can be considered to have outlived its purpose and is safe to be retired.

## Refactoring the data layer

A frequent source of disaster during upgrades is the database. It's a delicate collaborator since its implications reach beyond the code itself into foreign territory of an underlying database server. Add to the mix, Active Record models that make use of dynamic properties, a model's usage spanning across several modules, etc, and you have a mammoth number of adversaries to contend with. In this section, we go over a few rules of thumb to bear in mind while tackling this layer.

### Developing with migrations

One of the cardinal points to bear in mind is that migrations should be your sole platform for interfacing with the database, not some GUI client or DBMS.

There are a few conventions available for co-locating models and migrations. We can either create migration folders for each model, dump all migrations in one folder under the `AppModels` namespace, or any other clever method of co-habitation; each with its own con. It may even be more convenient to combine multiple conventions in order to reap maximum benefits i.e. all table creation migrations reside under one common directory so the paths of the relationship migration are not manually [configured](/docs/v1/database#Configuring-table-structure). Migrations for implementing certain features can then go into their appropriate directories.

### Modifying model columns

Modifying ORM model properties by adding new database columns is not a problem for existing consumers. The problem only surfaces when existing properties are either deleted or renamed. In order to get around this obstacle, the update has to propagate carefully. Among the available options, it is safer for both the outgoing and incoming changes to coexist. The old property should only be deleted and column removal migration ran when all clients have upgraded to the new property.