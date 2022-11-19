## Introduction

Suphle's testing framework is a wrapper around PHPUnit, Laravel's testing libraries, as well as abstractions for testing components not existing altogether in both libraries. In this chapter, we will be referencing some methods from both libraries in order to guarantee full coverage of whatever your testing requirements may be.

Suphle has a number of base, low-level test types which most of your tests are expected to extend in place of `PHPUnit\Framework\TestCase` -- specifically, those interacting with modules, the Container, the command console, those fundamental components. If you're simply testing a POPO and can afford to inject its dependencies yourself, using these test types will be unnecessary.

At the bottom of the hierarchy is `TestVirginContainer`. This is where all the other low-level test types extend from

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