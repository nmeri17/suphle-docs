## Introduction

Suphle's testing framework is a wrapper around PHPUnit, Laravel's testing libraries, as well as abstractions for testing components not existing altogether in both libraries. In this chapter, we will be referencing some methods from both libraries in order to guarantee full coverage of whatever your testing requirements may be.

Suphle has a number of base, low-level test types which most of your tests are expected to extend in place of `PHPUnit\Framework\TestCase` -- specifically, those interacting with modules, the Container, the command console, those fundamental components. If you're simply testing a POPO and can afford to inject its dependencies yourself, using these test types will be unnecessary.

At the bottom of the hierarchy is `TestVirginContainer`. This is what all the other low-level test types extend from.

Considering Suphle strong affinity for static-typing, it may come as a surprise that string-based double configuration is used. Using method names would've aided during refactorings, discovering and reading method usage, been consistent with Suphle's anti-string convention, etc. The present API gives us one advantage that makes us trade-off those earlier mentioned: brevity. The sheer amount of objects it takes both to create indirection from our end, and statically configure doubles from develper's end is enormous. Configuration objects then becomes noisy boilerplate even greater than configuration of the double itself.

When using this default doubling paradigm, during your routine refactorings, method names should not only be replaced by your IDE as a class token but as a string using its "replace in files" feature. This allows the method strings in your tests to equally get caught.

However, if your requirements supercede these drawbacks discussed, you are free to use something like [Prophecy](https://github.com/Phpspec/Prophecy). If you're going this route, do be aware that PHPUnit has a `prophesize` method for some slight convenience with creating new doubles

You may be curious as to the reason behind ModuleLevelTest requiring explicit specification of what modules to test, as opposed to say, plugging in `MyApp` directly. What this gives us is the ability to test specific modules before even involving them in the thick of the action

**
`replaceConstructorArguments` enables us inject stubs into the target object's constructor

As you may have heard already, Containers will throw all sorts all errors if they find themselves in an unconducive state. This means that if an object's constructor receives a simply stubbed Container, it would lead to unexpected results. For this reason, `replaceConstructorArguments` automatically fills in `getContainer` of the running base test type. If you plan on stubbing in an additionally configured Container, you can set the `useBaseContainer` argument to `false`



Illuminate\Database\QueryException: SQLSTATE[42S02]: Base table or view not found: 1146 Table 'suphle.users' doesn't exist (SQL: insert into `users` (`email`, 

Your migrations ought to have one folder where all table creations reside, in order to avoid errors similar to the above. This sort of structure will guarantee that all models, at the bare minimum, containing this folder have been migrated. The individual features can then go in the appropriate folder

within tests that make http requests, after calling `get` or `post`, Suphle refreshes `StdInputReader`. `PayloadStorage` depends on this class. And as you know, `Container::refreshClass`(link) cascades to all preceding consumers. This means that if your test contains a double using `PayloadStorage` or any class dependent on it, this double that obviously wasn't hydrated by container will be looking at a stale `PayloadStorage` and will produce unexpected results. In such cases, you want to inject `PayloadStorage` only after making the http request
[think this only applies to the lower level `setHttpParams`]

The purpose of using `dataProvider` is in order to have access to objects available to the container or module list at test build time i.e. during `setUp`. This method stores the state of all available containers before running and doesn't expect them to have been altered within any of the data sets of the given providers or within the tests themselves. This isn't the case outside `dataProvider` since PHPUnit is responsible for backing up and restoring object states in-between tests. `dataProvider` is ran as a single test rather than a series. This means you are responsible for resetting the container after interacting with it by either binding or extracting objects that should be unique between tests

// example @see IntraModuleTest->test_stores_correct_data_in_cache, makeRouteBranches

## mocking-doubles

As much as possible, run tests with objects closest to the real thing. We're already doing this by default, because the entire industry is built around this understanding. Development environment variables are the closest to replicating those used in production. That is the reason we have a local database, test card pins, dev smtps, etc. But just because we can replace a live version of something doesn't mean we should. The line of whether a replacement should be done or not should be drawn at the answer to the question: does this object reach into external domain? Http request objects do, thus, are prime candidates for replacement. So are mail objects
They can be swapped using any convenient method such as object doubling or simply running with test parameters

The line blurs where database objects are involved, since the database is usually locally hosted and subject to testers whim. All other objects should only ever be doubled when we'd prefer not to incur the cost of its hydration chain or we want to observe the behaviour or response of our SUT when the doubled object is in a specific state

Tests shouldn't be an exercise performed to give fake guarantees such as those gotten by removing explosive hatches with potential to fail the test. The objects their methods and collaborators should be exercised at least once in the test suite

Test doubles are not evil, but are a shortcut to extending objects into sub-classes that either return a value we're absolutely sure is actually returned (also known as stubs), or to verify one or more methods are called with an expected list of arguments (also known as mocks). The idea with mocks is that the doubled/bypassed methods are either covered by some other test, relies on collaborators we will prefer not to incur, makes outbound calls, or will simply cause us to test behavior outside the scope of the current test

