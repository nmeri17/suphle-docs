## Introduction

Time is often cited as a constraint in the way of automating tests for a codebase, but that is neither accurate nor honest. Ultimately, everyone tests their code -- just not in an automated way. This page eases in on points to enhance the reader's current way of verifying expectations.

### Actual reasons tests are not automated

Developers are more inclined to test their code in the browser because:

1. We are mostly visual creatures.

1. We started out on the front end and got used to checking the DOM for our updates.

1. Books and manuals all guide the user to observe updates through the browser or mobile device because it has a lower barrier of entry (the eyes and brain), over knowledge of testing strategies, appropriate code design and framework-specific testing methods.

1. Documentation relegates it to the last page or peripheral section.

1. We don't know there are test methods that can confirm the behavior we want to visually assert.

1. We don't know automation is more flexible because then, we can 
initialize our database to a desired state, isolate a step of a process they would have otherwise followed sequentially from the browser, and test or debug that as a piece of functionality.

While we can't do much about our natural predicament, we can salvage the last two points above. First, we should look at how to identify what the automated equivalent of our desired outcome is. Then, we will learn how to [extract a piece](#Isolating-units-for-testing) of our app for testing purposes.

## Literal equivalent identification

Test equivalent identification is so important that without it, we won't know how to verify our disconnected parts when we learn how to detach them.

Identifying the automated equivalent of the behavior you wish to observe begins with where you would have asserted it without tests. If you would've gone through your DBMS, the test equivalent will be database-related -- either it revolves around a trait containing the term "database" or a similar nomenclature. The same way you find the updated row and visually appraise the column in question, in your test, you'll drill down to relevant using its identifier, and assert its column is in order.

Below, we illustrate the automation of a [database verification using Suphle's](/docs/v1/database#Testing-the-data-layer) available constructs.

```php

class SomeDatabaseTest extends ModuleLevelTest {

	use BaseDatabasePopulator;

	protected function getModules ():array {

		return [new ModuleOneDescriptor(new Container)];
	}

	protected function getActiveEntity ():string {

		return ModelUnderTest::class;
	}

	public function test_service_changes_database_field () {

		$insertedRow = $this->replicator->modifyInsertion(

			1, ["foo" => "enyii"]
		)->first(); // given

		$newValue = "saburi";

		$this->getContainer()->getClass(SomeUpdatefulService::class)

		->updateColumnFoo($newValue); // when

		$this->databaseApi->assertDatabaseHas([

			"id" => $insertedRow->id,

			"foo" => $newValue
		]); // then
	}
}
```

In the test above, the database is seeded with a known value to ensure our change is not effected against any random entity but that which we expect to be modified -- much the same way a DBMS row is observed before and after running a piece of code we're visually verifying.

To conduct tests interacting with the database, knowledge of [migrations](/docs/v1/database#Configuring-table-structure) is compulsory. They are an object-oriented, incremental means of programmatically customizing the database column properties that the GUI DBMS offers with drop-downs. They are ORM specific, so if you're unfamiliar with them, consider going through the documentation of your connected ORM.

If you would have opened a page to follow a visual cue after performing an action, check for the test method that cue best translates to. Perhaps, some part of your code must have already interacted with the fields in question. That could also give you a clue on what the automated equivalent of that which you seek to verify is.

Say, you have a varied list of cars in your database, and want to test the latest functionality, that your users can sort by the most recently uploaded car. What property distinguishes the attribute of being a "recent" car? Let me guess, the code fetching recent cars orders them by their upload date. The test now has to verify that the objects returned are sorted in a manner conforming with the business expectations.

```php

public function test_cars_are_sorted_by_date () {

	$dateKey = "release_year";

	$camry = ["name" => "camry", $dateKey => 1990];

	$venza = ["name" => "venza", $dateKey => 1985];

	$benz = ["name" => "benz", $dateKey => 2002];

	$cars = [$camry, $venza, $benz]; // given

	$sortedCars = $this->getContainer()->getClass(CarReadingService::class)

	->getMostRecent($cars); // when

	$this->assertSame($sortedCars, [$benz, $camry, $venza]); // then
}
```

Another way we manually test our code is by using the var-dump-die combo or the framework's variant for well-formatted output. You may have observed that Suphle has no such construct. This is no accident. Such functions foster and encourage undocumented behavior, untyped signatures, when verifying the state of an object, value of a primitive computation. The confusion of the current reader is an indication that tomorrow's maintainer will ask the same questions this reader did -- questions they will be grateful did not exist in the first place; because without exception, each of these scenarios is a pointer to a problem that should be solved in a more appropriate manner to var-dumping.

For example, to verify an SUT's state after an action, [induce that action and observe its targets](/docs/v1/appendix/Building-blocks-of-the-testing-chain). Adequately comment complicated implementation. Type your parameters, instance properties and return types.

## Isolating units for testing

We usually don't need to disconnect a portion of our system for testing if the cluster is working correctly. If features are built from similar structures, it'll be easy to test any of its constituting elements using the same pattern. However, since complex features are composed with relatively irregularly shaped structures, the manner in which they can be isolated for testing varies according to their specification.

Doing this in code implies [strategies](#unit-isolation-strategies) for recreating invocation of the target in a state identical to how it would've been called organically. We will explore ways to segregate functionalities we want to trigger outside their natural habitat.

### Broad setup scopes

Before extracting our test subject for executing the effect we wish to observe, that subject may have to be setup. This phase is referred to here as Setup Scope. Tests can either have a broad or minimal setup scope. The scope is determined by evaluating the size of collaborators required to re-create enabling environment for the SUT to run.

One of the problems with broad setup scopes is the maintenance overhead. Since it's coupled to too many things, or complex things, it has to be refactored whenever those dependencies are updated, even if the actual function the test verifies did not change. On the other hand, minimal setup scopes make for tests that are easier to write and easier to maintain.

Some common examples of tests that require broad setup scopes are discussed below:

#### Culpable requests

Even though its effect is not felt on the UX, incoming requests with convoluted payloads or structures are a code smell. 

This means that if you have the slightest difficulty with writing out the request object your action method is expecting, it's an indication that finer grained control can be achieved by splitting that particular request over multiple, smaller requests; save their state somewhere, the user ought to progress sequentially until the last stage. Multi step forms and lengthy forms, forms with diverse data types (think arrays) are most likely to put back-end developers in this precarious position. They should defend themselves with database drafts or event sourcing.

The monolithic size of a request's payload should not be allowed to obstruct you from extracting relevant portions of functionality for testing.

#### Injecting lengthy parameters

Instantiating a large number of arguments into constructors can get 
tiresome and make the test unwieldy. This problem may be difficult to spot due to the fact that dependencies are advised to be [hydrated automatically](/docs/v1/testing#Reading-from-active-Container) rather than manually. However, closer attention to some of the calls made to those dependencies within the SUT, should reveal a trend indicating some collaborators with a shared objective, that should be grouped into another class.

### Unit isolation strategies

All strategies favor extracting surrounding conditions enabling replication of our Area of Interest, hopefully, without triggering unwanted side effects.

#### Extracting into methods

This strategy is perhaps the easiest to implement and is most relevant for testing internal behavior rather than externals such as the result of a method call. It advocates for pulling out clusters of tangled code into standalone methods that can be tested. Methods should not contain so much logic in and of themselves that it takes considerable effort to replicate conditions necessary for verifying its entrails.

[As has already been said](/docs/v1/appendix/Building-blocks-of-the-testing-chain#the-induction), any value we intend to test has to end up somewhere, either assigned to a property nor returned by the method. Otherwise, there simply would be no way to observe it. Wrapping the steps leading up to that value, `x`, crowded in the middle of a lengthy sheet of statements makes for more cohesive, cleaner code that is ready for reuse. But when that is not possible, hook up a checkpoint wherever `x` is eventually used, with the aid of mocks and spies.

There can be some dilemma between methods concealing/encapsulating variables vital to their inner workings, and ensuring the influential parameters they need to do their work can be supplied externally. This conflict of interest occasionally presents itself as private methods, fixed values, or what have you.

#### Working with dates

Dates should never be defined within the same space where they intend to be used. Dates here, refers to its usage in the domain layer, for example in relative and semantic contexts such as `today`. When the domain logic intends to subtract `x` days from today, in order to pull purchases made on that date, the subtraction and pulling operations should not co-exist.

This problem has been solved by the recent PSR-20 that introduced the Clock interface. In case you're unaware of it or are indisposed to such formalities, endeavor to subtract at one location and inject the target date into fetcher method so any date can be injected into the fetcher from the test environment.

#### Peeling off RCAs

RCAs are Request-Context-Aware objects and refers to the general class of objects the Framework provides for reading user input. In Suphle, they not only include the obvious culprits like `RequestDetails`, payload readers (both the internal and external ones, and the likes) and CLI readers, but also middleware and user-land classes that rely on any of these objects.

What this isolation suggests is for such classes to be decoupled from the domain layer where you test. Instead of using them there directly, the value should be read at some preliminary layer before its value/raw input is injected into our domain objects. This enables their arguments easily creatable in the test. The reason behind the difficulty in reproducing RCAs is that their lifetime are managed, and contents populated by external forces beyond our control, that didn't intend for them to be reproduced in user-land. Thus, they should be stripped away for our own good.