## Introduction

Suphle's testing framework is a wrapper around PHPUnit, Laravel's testing libraries, as well as abstractions for testing components inexistent in both libraries. The format used throughout this documentation has been to demonstrate its use on those chapters rather than convening them on one grand page that will likely overwhelm a reader from testing. Thus, what will be introduced here are the base test types for creating conducive environment for verifying your Suphle components. In addition, we will discuss how to have fun with Suphle's mocking library.

## Running tests

All bootstrapping necessary to create conducive environment for the various [test types](#Base-test-types) are handled by the PHPUnit test runner. If you're not familiar with it yet, it is PHP's industry standard for testing and the tool on which every other testing framework is based off. The same way the most basic PHPUnit tests are being run is what is tenable in Suphle as well. For instance, to run all tests, we'd do:

```bash

phpunit "/project/path/tests"
```

A directory path is given above but a file can equally be provided. The command can optionally filter executed tests [to a specific one](/docs/v1/appendix/Building-blocks-of-the-testing-chain#Combining-event-induction-and-observation), or selectively executes [test suites](https://docs.phpunit.de/en/10.0/textui.html#selection).

### Executing tests in parallel

Activities such as running large test suites or compiling huge code-bases have been memed as an opportunity to grab a cup of coffee. However, developers short on time for a coffee break are advised to leverage their machine's cores by running the tests concurrently. The defacto library for achieving this in PHP is Paratest. To use it, we'll simply replace the `phpunit` binary like so:

```bash

paratest "/project/path/tests"
```

[Its repository](https://github.com/brianium/paratest) mentions some of its notable modifiers for customizing run behaviour. However, it currently has one known limitation, which is that it mutes all terminal output from your script during and after running, since it replaces the PHPUnit printer. This means you should not expect to see any `var_dump`s, but any exceptions resulting it test termination will be flushed as usual.

Parallel testing is associated with a few, minor caveats, but specific to the interactions being conducted by the test. These are discussed below.

#### Parallel testing the file-system

 Those pertaining to the file-system may need to avoid race conditions by dynamically setting test class to a hashed value, like so:

```php

class OneFileSystemTest extends ModuleLevelTest {

	protected function setUp ():void {

		parent::setUp();

		$this->file = __DIR__ . "/test_file_" . sha1(uniqid(__METHOD__)); // it's important that this assignment occurs after setting up any class parents as shown above
	}

	protected function getModules ():array {

		return [new ModuleOneDescriptor (new Container)];
	}

	public function test_some_file_system_feature () {

		//
	}
}
```

This workaround is only necessary if you have multiple file-system based tests accessing the same resource and randomly getting permission errors.

#### Parallel testing the database

No additional work is needed on your part to make the database suitable for parallel testing. The default [database configuration](/docs/v1/database#Configuring-the-database) checks for the presence of the parallel indicator, and adjusts its value accordingly.

## Base test types

These are low-level test types which most of your tests are expected to extend in place of `PHPUnit\Framework\TestCase`. The are basically context-aware wrappers that erase inconsistencies that may arise from interacting with these environment within the scope of a test becuase they were not properly booted into a compatible state. Beside the environments listed below are their corresponding test types:

|Test-type|Environment|
|---------|-----------|
|`Suphle\Testing\TestType\CommandLineTest`|[The command console](/docs/v1/console#Testing-commands)|
|`Suphle\Testing\TestType\InstallComponentTest`|[Component templates installation](/docs/v1/component-templates#Testing-component-installation)|
|`Suphle\Testing\TestType\InvestigateSystemCrash`|[System involuntary shutdown](/docs/v1/exceptions#Specific-exception-testing)|
|`Suphle\Testing\TestType\IsolatedComponentTest`|[Only one Container required](#Hydrating-single-SUTs)|
|`Suphle\Testing\TestType\ModuleLevelTest`|[Natural modular habitat](/docs/v1/modules#Testing-modules)|

Although it's extremely unlikely, if functionality you wish to test doesn't fall into any of those categories, it's unnecessary to extend them. Instead, configure the `PHPUnit\Framework\TestCase` class itself match your target constraints.

Each of the test-types is treated at length in their respective chapters. Before running your tests, they will replace Framework-aware classes that may incur communication with external sources, as well as those that don't make sense in a CLI context, with their neutered equivalents. Custom classes that fall into this category should be duly replaced before the action that triggers their execution is fired.

## Hydrating single SUTs

Not to be confused with [Component templates](/docs/v1/component-templates), the `IsolatedComponentTest` intended target is simple integration tests and unit tests. Suppose we want to test an object with dependencies injected through its constructor, this test type offers a booted Container to be used for hydrating any of those collaborators that shouldn't be mocked i.e. isolating that one entity from its surroundings.

In a nutshell, an object is pulled out of the Container, an action performed against that instance and its result verified:

```php

use Suphle\Testing\TestTypes\IsolatedComponentTest;

class SomeServiceTest extends IsolatedComponentTest {

	public function test_my_awesome_service () {

		$myService = $this->container->getClass(SomeService::class);

		$this->assertTrue($myService->doThing()); // then
	}
}
```

### IsolatedComponentTest scope

This scope of this test type is somewhat limited in the following ways:

1. Since no module is attached to the Container released to you, any interfaces required while recursively hydrating your concrete's collaborators will have to be bound using its `simpleBinds` and `concreteBinds` methods.

```php

class DependentServiceTest extends IsolatedComponentTest {

	protected function simpleBinds ():array {

		return array_merge(parent::simpleBinds(), [

			SomeInterface::class => ItsConcrete::class
		]);
	}

	protected function concreteBinds ():array {
		
		return array_merge(parent::concreteBinds(), [

			SomeOtherInterface::class => new OtherInterfaceConcrete("suphle")
		]);
	}

	public function test_my_awesome_service () {

		//
	}
}
```

As was earlier stated, volatile elements require replacements. It's more convenient to contact them using the calls to the `parent` method rather than re-definition at each test class.

Internally, the interfaces supplied through `simpleBinds` are hydrated and bound for you before test run commences.

The fact that its Container is capable of hydrating dependencies shouldn't deter any necessary mocks from being bound.

1. This test type makes no guarantees regarding exception catching and [broadcasting prevention](/docs/v1/exceptions#Broadcasting-exception-details). Doing so requires events, which must be initialized by binding listeners on its module. Attempting to combine it with components that interact with events will terminate outright, except an accompanying module descriptor is bound. In such cases, it's simply better to use a `ModuleLevelTest`.

### Disabling single Container decorator

Suppose some functionality should be tested without executing the various decorators attached to either it or its ancestors, the decorator of the Container `IsolatedComponentTest` offers can be muted by setting the `usesRealDecorator` property to `false`.

```php

class DecoratedServiceTest extends IsolatedComponentTest {

	protected bool $usesRealDecorator = false;

	public function test_my_awesome_service () {

		//
	}
}
```

## Module-based tests

Every other test type aside `IsolatedComponentTest` requires at least one module to function properly. We will refrain from examining all of them here and only focus on `ModuleLevelTest`. Even though that test type was dissected on its chapter, there are still some in-depth details that were glossed over, there on the grounds of irrelevance to module based testing itself.

### HTTP-based tests

With the exception of `InvestigateSystemCrash` all tests within this category have an abstract `getModules` method for declaring modules to participate in the test. The reason for using this method rather than connecting your `AllModules\PublishedModules` application directly is to allow for the ability to test specific modules exclusively, before even involving them in the thick of the action.

```php

namespace AllModules\ModuleOne\Tests\SomeDomain;

use Suphle\Hydration\Container;

use Suphle\Testing\TestTypes\ModuleLevelTest;

use AllModules\ModuleOne\Meta\ModuleOneDescriptor;

class SomeDomainTest extends ModuleLevelTest {

	public function getModules ():array {

		return [new ModuleOneDescriptor(new Container)];
	}

	public function test_something_module_specific () {

		//
	}
}
```

`ModuleLevelTest` and `InvestigateSystemCrash` are the only test types to support inbound HTTP requests into the application or connected modules. These tests are spun up by calling any of the four HTTP methods: `get`, `post`, `put`, and `delete`. Doing so would execute the request in an identical manner to a user accessing the application from the real world.

```php

class SomeDomainTest extends ModuleLevelTest {

	public function test_module_path_shows_certain_content () {

		$this->get("/path/in/module") // when

		->assertSee("Expected content"); // then
	}
}
```

Whether the entire project's modules are run on the application server, or a select number of modules are utilized within test scope, each incoming request wipes the slate left by the preceding request clean. Any dependencies remotely reliant on any of the request-context-aware objects encountered during that execution will be destroyed. The implication is that if your test contains a double using any of those RCAs, that double will be looking at a stale RCA and will produce unexpected results since it's not managed by the Container.

Where a mock with RCA dependencies should partake in a test, consider applying the [RCA-peeling](/docs/v1/appendix/Transition-from-visual-to-automated-testing#Peeling-off-RCAs) isolation strategy.

#### Debugging HTTP exceptions

When we automate HTTP tests into our application, the test won't fail if it encounters an error; rather, the call will return a response object with a payload containing formatted error-handled message, along with status code 500.

Often, this isn't very helpful when trying to determine the reason test is not passing and would require reading possibly mangled response from the CLI. In order to prevent this, we want failing HTTP tests to terminate before reaching associated exception diffuser. This is achieved by setting class property `debugCaughtExceptions` to `true`.

```php

class TriggerHTTPTest extends ModuleLevelTest {

	protected bool $debugCaughtExceptions = true;

	public function test_http_endpoint () {

		$this->putJson("/segment", [

			"some" => "payload"
		]); // when

		// then, some assertion that won't run if above call ran into an error.
	}
}
```

### Enabling volatile objects

When it's necessary to test the application or some modules with objects closest to those experienced in real life, we can prevent module-level replacement by setting the `useTestComponents` property to `false`.

```php

class ProductionOnlyBugTest extends ModuleLevelTest {

	protected bool $useTestComponents = false;

	public function test_some_problematic_live_service () {

		// given // replicate conditions in log+env

		$this->get("/path/in/module") // when

		->assertStatus(500); // then
	}
}
```

## Test environment cross-cutting concerns

In spite of their individual uniqueness, since all test-types extend `TestVirginContainer`, similar functionality is streamlined across diverse contexts.

### Binding objects within a test

The `massProvide` method present on all test types, is used to dispatch objects into the Container. The given concretes are bound to the sole Container on single Container-based tests.

As is detailed [in its chapter](/docs/v1/modules#Binding-automatic-doubles), the recommended location for binding module-scoped objects to their respective Containers is to use the module's build phase. An exception to this rule was mentioned there. Other occassions where it's permissible to bind within the test body include:

- Doubles and dependencies whose formation requires the Container. These are not available during that phase.
- When you deliberately want to bind an instance of the same object to all Containers participating in the test. Proceed with caution when binding mocks to all Containers as, while the test may pass, it won't convey whether it was executed within the expected module.

Irrespective of the test-type, the `massProvide` method can be used to bind given instances to all Containers connected:

```php

public function test_app_pulls_some_stunt_when_stub_is_x () {

	$this->massProvide([

		SomeInterface::class => $this->replaceConstructorArguments(

			SomeInterface::class, [], [

				"stub" => "x", // given
			]
		)
	]);

	$responseAsserter = $this->get("/path"); // when

	// then // make assertions
}
```

### Reading from active Container

3 ways SUTs can be hydrated within the testing scope are by:

1. Creating them by hand.
1. Retrieving them from the Container.
1. Hydrating their test double.

Test scopes are the only ones were the service locator is inevitable. The Container can always be referenced on all test-types using their `getContainer` method.

```php

public function test_some_object_behavior () {

	// given // pre-conditions

	$container = $this->getContainer();

	$result = $container->getClass(SomeSut::class) // service-locator retrieval

	->doThing($argFromWherever); // when

	// then
}
```

There's little ambiguity on `IsolatedComponentTest` regarding what Container is being referred to by this method. On module-level tests involving one or more Containers, it'll always returns **a copy** of the first Container unless routing activity has occured, in which case, a copy of the Container of the handling module will be returned. This is due to a number of reasons beyond the confines of this document. Nevertheless, it should not be a problem although it's worth noting all the same -- all bindings will remain intact.

### Container assisted fixtures

Data fixtures, or data sets, are a series of entries to supply a test method. They are used when we intend to exercise the same body of test against diverse input. PHPUnit's provided method of declaring data fixtures is through methods added to the test method's `@dataProvider` docblock annotation. The limitation with this annotation is that in order for the test runner to determine the number of test cases to be executed, the length of each fixture must be calculated before the `setUp` method. At this point in the test's lifecycle, it's impossible for any framework-controlled objects to have been created. In addition, as from PHPUnit 10, methods given to that annotation must be static, which makes sense since no instance variables are expected to have been created.

Data fixtures using primitive values and objects easily initialized by hand are unlimited by any of these barriers. Fixtures outside this category can still polyfill the `@dataProvider` functionality using the  `dataProvider` method present on all descendants of `TestVirginContainer`.

A hypothetical usage will look as follows:

```php

public function test_strangeType_returns_expected_output () {

	$this->dataProvider([

		$this->allStrangeTypes(...) // given
	], function (
		string $expectedOutput, StrangeType $handler, $payload = null
	) {

		$result = $this->getContainer()->getClass(ProcessingService::class)

		->handleStrangers($handler, $payload); // when

		$this->assertSame($expectedOutput, $result); // then
	});
}

public function allStrangeTypes ():array {

	return [
		[
			"Non-Suphle devs have no clue what they're missing out on",

			$this->positiveDouble(StrangeType::class, [

				"getWhatsMissing" => "all_the_fun"
			])
		]

		// define as many entries as required or as can be foreseen
	];
}
```

All characteristics differentiating this method from PHPUnit's native annotation are tabled below:

|`TestVirginContainer::dataProvider`| `@dataProvider`|
|-----------------------------------|----------------|
|Can be run after `setUp`.			| Cannot.		 |
|Since no pre-calculation occurs, it lumps all assertions under those fixtures as *1 test* e.g. a test body with 3 assertions and 5 fixtures produces `1 test 15 assertions`.|The same test is reported as having `5 tests 15 assertions`.|
|Gives property details and contents of any reference objects part of the failing entry.|Truncates reference objects.|
|Retains the state of Containers in-between tests until an action wipes any affected one e.g. an HTTP request.|Refreshes and restores all object state in-between tests.|

### Observing Container activity

This refers to an object with methods available for hooking into connected Container, and is intended for internal use, or some complex configuration not yielding expected results in user-land. It is discussed in detail in [the Container chapter](/docs/v1/container#Inspecting-container-activity), but deserves a mention here as well, as it is ubiquitous among all our test types.

## Test doubles

This section addresses a pertinent topic in the testing world known as Mocking. It's all about leveraging the underlying testing framework to duplicate target classes and either force them to return certain values or verify they were invoked with values matching some expectation, in ways that enable us affirm some knowledge about the system being tested.

In this documentation, they will be referred to as "test doubles" rather than the more popular but confusing term "mocks". It's important that distinction is made, since mocks themselves are actually just one type of test doubles.

### When to use test doubles

As much as possible, run tests with objects and collaborators closest to the real thing. We're already doing this by default, because the entire industry is built around this understanding. Development environment variables are the closest to replicating those used in production. It is for the same reason we have local databases, test card PINs, dev SMTPs, etc. But just because we can replace a live version of something doesn't mean we always should. The line of whether a replacement should be done or not should be drawn at the answer to the question: *does this object reach into external domain?* Http request objects do; thus, are prime candidates for replacement. So are mail objects. These kind of objects can be swapped using convenient means such as test doubling.

However, the line blurs where database objects are involved, since the database is usually locally hosted and subject to testers whim. All other objects should only ever be doubled when we'd prefer not to incur the cost of its hydration chain, or when we want to observe the behaviour or response of our SUT when the doubled object is in a specific state.

Tests shouldn't be an exercise performed to give fake guarantees such as those gotten by removing explosive hatches with potential to fail the test. The objects, their methods, and collaborators should be exercised at least once in the test suite.

All these warnings may give the impression that test doubles are evil although they're not, as long as none of these precepts are broken. They are a shortcut to extending objects into dynamic sub-classes that either return a value we're absolutely sure is actually returned (formally known as **stubs**), or to verify one or more methods are called with an expected list of arguments (formally known as **mocks**). The idea with mocks is that the doubled/bypassed methods are either covered by some other test, relies on collaborators we will prefer not to incur, makes outbound calls, or will simply cause us to test behavior outside the scope of the current test.

### Making test doubles

PHPUnit has native methods for creating diverse kinds of test doubles, which Suphle's testing framework abstracted onto a platform for compact configuration i.e. assigning majority of functionality using string names of the target methods rather than IDE referencable method names.

Considering Suphle strong affinity for static-typing, it may come as a surprise that string-based double configuration is used. Using invokable method names would've aided during refactorings, discovering and reading method usage, been consistent with Suphle's anti-string convention, etc. The present API gives us one advantage that makes us trade-off those earlier mentioned: brevity. The sheer amount of objects it takes both to create indirection from our end, and statically configure doubles from user-land is enormous. Configuration bureaucracy then becomes noisy boilerplate that envelopes the intention itself.

However, if your requirements supercede these drawbacks discussed, you are free to either use PHPUnit's native configuration, or a library like [Prophecy](https://github.com/Phpspec/Prophecy). If you're going this route, do be aware that PHPUnit <10 have a `prophesize` method for some slight convenience with creating new doubles.

The methods exposing Suphle's test doubling component are present on all descendants of `TestVirginContainer`. When using them, during your routine refactorings, method names should not only be replaced by your IDE as a class token but as a string using its "replace in files" feature. This allows the method's string appearances in your tests to equally get caught.

#### Creating stubs

Stubs have been defined as dynamic sub-classes that either return a value we're absolutely sure is actually returned. They can be created for target interfaces, abstract classes, as well as regular classes. These stubs are then used as dependencies of an SUT that's expected to react in a certain way to such return values.

When the targets are interfaces or abstract methods, stub behavior is consistent, in the sense that all its methods either return preset values, or a test-double equivalent of the type-hinted value. An interesting consideration however, is when these stubs given as dependencies (or collaborators), are classes with fleshed-out methods: is it necessary to derive actual values from the target class or should it be treated entirely as a dud double by skipping the target and returning null for al unstubbed methods?

The solution to the dilemma depends on your use-case -- if invocation of certain methods will incur calls irrelevant to the present test, it's more convenient to mute them, as long as those methods are eventually tested somewhere else.

Stubs replacing only a fraction of methods on the target are created using the `positiveDouble` method, while those that override all methods in addition to those being stubbed are created using its `negativeDouble` counterpart.

```php

public function test_sut_does_foo_when_dependency_returns_bar () {

	$dependency = $this->positiveDouble(TargetEntity::class, [ // given

		"awesomeMethod" => "bar",

		"someOtherMethod" => "nmeri"
	]);

	$result = $this->getContainer()->getClass(Sut::class)->doThing($dependency); // when

	$this->assertSame($result, "foo"); // then
}
```

[Dynamic return-types](https://phpunit.de/manual/3.7/en/test-doubles.html#test-doubles.stub) are those subject to the target's context or incoming input and can be configured in addition to the pre-determined preset above. They include but are not limited to the methods `returnArgument`, `returnSelf`, and `returnCallback` for lower level return value generation.

##### Stubbing repeated calls to a method

The configuration above will always return `"bar"` irrespective of the number of times it's being called. Although it's not always advisable to couple expected return values to a strict, consecutive call sequence, certain occassions may demand it. In order to stub a sequence such as this, we employ the `positiveDoubleMany` method.

```php

public function test_sut_does_foo_when_dependency_returns_certain_values () {

	$dependency = $this->positiveDoubleMany(TargetEntity::class, [ // given

		"awesomeMethod" => ["bar", "ujubaby"],

		"someOtherMethod" => "nmeri"
	]);

	$result = $this->getContainer()->getClass(Sut::class)->doThing($dependency); // when

	$this->assertSame($result, "foo"); // then
}
```

When `positiveDoubleMany` encounters array return values, they are being treated as consecutive calls to given method, and each value will be subsequent returned. Ensure that its usage is not being shoehorned and that no suitable alternative for what you're trying to do exists.

#### Creating mocks

Mocks have earlier been defined as test-doubles or dynamic sub-classes that allow us verify one or more methods were called with an expected list of arguments. They are being created in a similar manner to stubs, the difference lying in the mock configurations being defined.

Suppose we intend to mock the `TargetEntity::awesomeMethod` method, the test will be counted as a failure if after its completion, that method was not executed a number of times matching given expectations.

```php

public function test_awesomeMethod_must_be_called () {

	// given // some pre-conditions

	$dependency = $this->positiveDouble(TargetEntity::class, [], [

		"awesomeMethod" => [1, ["foo"]] // then
	]);

	$this->getContainer()->getClass(Sut::class)->doThing($dependency); // when
}
```

The configuration above aims to verify that `TargetEntity::awesomeMethod` will be invoked exactly once during the test's execution. To declare an arbitrary number of invocations, the digit, 1, can be replaced with a call to `any`.

```php

public function test_awesomeMethod_must_be_called () {

	// given // some pre-conditions

	$dependency = $this->positiveDouble(TargetEntity::class, [], [

		"awesomeMethod" => [$this->any(), ["foo"]] // then
	]);

	$this->getContainer()->getClass(Sut::class)->doThing($dependency); // when
}
```

In a similar vein to pre-determined return values, mocks can be configured to verify dynamic arguments. In case the test seeks to verify given argument is above a certain figure, we'll use the `greaterThan` method like so:

```php

public function test_awesomeMethod_must_be_called () {

	// given // some pre-conditions

	$dependency = $this->positiveDouble(TargetEntity::class, [], [

		"awesomeMethod" => [1, [$this->greaterThan(24)]] // then
	]);

	$this->getContainer()->getClass(Sut::class)->doThing($dependency); // when
}
```

The test fails if `TargetEntity::awesomeMethod` is called with any integer below 24, more or less than once. The inner array in the mock definition will accept as many values as parameters defined on the target method, which we intend to verify.

Other [verification matchers](https://phpunit.de/manual/3.7/en/test-doubles.html#test-doubles.mock-objects.matchers) include `stringContains`, the generic `anything`, and the lower level `callback` method for customizing matching logic.

As you may have guessed, stubs may be combined with mocks under the same definition. The implication of not doing so is that the mocked methods will return null if the SUT ever attempts to read the value of the same method being mocked.

#### Test double constructors

The doubles created by the `positiveDouble` family of methods exclude the constructor of the target entity if it has any. If execution affects any instance level properties expected to have been injected during instantiation, those properties will be seen as `null`.

There are two ways of explicitly sending arguments into your test doubles. Which of them you choose depends on the requirements of your test double.

##### Auto-completed double constructors

The `replaceConstructorArguments` method offers the greatest flexibility with configuring the arguments being passed to double's constructor. It takes an optional list of argument names or preferably, their types.

```php

public function test_collaborators_dependency () {

	$sut = $this->replaceConstructorArguments(TargetEntity::class, [ // given

		SomeInterface::class => $this->positiveDouble(SomeInterface::class, [

			"awesomeMethod" => "bar"
		])
	]);

	$result = $sut->doThing(); // when

	$this->assertTrue($result); // then
}
```

Any missing parameters from the list explicitly given to `replaceConstructorArguments` will be replaced by its test double equivalent, with the exception of target objects with the Container as one of their parameters. Also bear in mind that arguments are not doubled recursively. If your doubled dependencies in turn rely on their own instance properties, you'll either have to stub those methods or consider using [their live versions](#Reading-from-active-Container).

Auto-completed double constructors do not prohibit the tester from stubbing or mocking. [Their arrays](#Creating-stubs) are received as the 3rd (`methodStubs`) and 4th (`mockMethods`) arguments, respectively, to the `replaceConstructorArguments` method.

###### Configuring auto-generated double constructors

Any auto-generated argument will be created by means of `positiveDouble`. In order to use `negativeDouble`, the 5th argument (`positiveDouble`) to `replaceConstructorArguments` should be set to `false`.

Containers will throw all sorts all errors if they find themselves in an unconducive state. This means that if a class constructor receives a simply stubbed Container, its usage will produce unexpected results. For your convenience, `replaceConstructorArguments` automatically [uses the Container](#Reading-from-active-Container) of the running test type. If you plan on stubbing in an manually configured Container, you can set the 6th argument (`useBaseContainer`) to `false`. This boon equally happens to be a limitation excluding this method from being used outside test bodies e.g. within `getModules`, since no Container is available then.

The constructor of some target classes entail more than simple argument assignment. When an object's instantiation involves calling some methods on the same class, the doubling process will fail if any of those methods has equally been mocked or stubbed since it's unavailable at that point in the object's lifetime. Since it's impossible for Suphle's testing framework to be aware of those internal instantiators, it must be informed to include them in the doubling process by setting the 7th argument (`invokeConstructor`) to `true`.

##### Manual double constructors

This refers to doubles created whereby no further verification is done regarding completeness of constructor arguments supplied. We create these by passing parameter values as the 4th argument (`constructorArguments`) of any method in the `positiveDouble` family.

```php

public function test_sut_does_foo_when_dependency_returns_bar () {

	$container = $this->getContainer();

	$constructorArguments = $container->getMethodParameters(

		Container::CLASS_CONSTRUCTOR, TargetEntity::class
	);

	$dependency = $this->positiveDouble(TargetEntity::class, [ // given

		"awesomeMethod" => "bar"
	], [], $constructorArguments);

	$result = $container->getClass(Sut::class)->doThing($dependency); // when

	$this->assertSame($result, "foo"); // then
}
```
