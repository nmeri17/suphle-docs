## Introduction

Time is often cited as a constraint in the way of automating tests for a codebase, but that is neither accurate nor honest. Ultimately, everyone tests their code; just not in an automated way. This chapter eases in on points to aid the reader automate their current way of verifying expectations.

## Actual reasons tests are not automated

Developers are more inclined to test their code in the browser because:

1. We are mostly visual creatures.

1. We started out on the front end and got used to checking the DOM for our updates.

1. Books and manuals all guide the user to observe updates through the browser or mobile device because it has a lower barrier of entry (the eyes and brain), over knowledge of testing strategies, appropriate code design and framework-specific testing methods.

1. Documentation relegates it to the last page or peripheral section.

1. We don't know there are test methods that can confirm the behavior we want to visually assert.

1. We don't know automation is more flexible because then, we can 
initialize our database to a desired state, isolate a step of a process they would have otherwise followed sequentially from the browser, and test or debug that as a piece of functionality.

While we can't do much about our natural predicament, we can salvage the last two points above. First, we should look at how to identify what the automated equivalent of our desired outcome is. Then, we will learn how to [disconnect or extract](#Introduction-to-Isolation) a piece of our app for testing purposes.

## Literal equivalent identification

Identification is so important that without it, we won't know how to verify our disconnected parts when we learn how to detach them

Identification begins with where you would have asserted that behaviour without tests. If it's from your dbms, the test equivalent will be prefixed with "database". The same way you find the updated field and visually appraise the column in question, in your test, you'll pull using that id and assert the column is in order

// show not pulling but working with a factory produced instance

If you would have opened a page after performing an action, and follow a visual cue, check for the test method that cue best translates to. These are usually the easiest means of identification. This is because some part of your code must have already interacted with the fields in question. Your test should try to back that action up

Say, you have a varied list of cars on your database, and want to test the latest functionality, that your users can sort by the most recently uploaded car. What property distinguishes the attribute of being a "recent" car? Let me guess, the code fetching recent cars orders them by their upload date. The test now has to verify that the cars returned are indeed sorted in order 

So, we look for test methods that enable us work with collections. Among them, we want one that allows us compare items in a collection by a certain field

// example if such method exists 

Another way we manually test our code is by using the var-dump-die combo or the framework's variant for well-formatted output. You may have observed that Suphle has no such construct. This is no accident. It is used for method with undocumented, untyped signatures, or when verifying the state of an object, or value of a primitive computation.

## Documentation as a by-product

Converting that procedure to a test isn't as convenient as adding and later deleting the var_dump combo, and carrying on with your work. However, if your confusion is anything to go by, there's every likelihood that tomorrow's maintainer will ask the same questions you did -- questions they will be grateful to find A test has already answered.

// example of working with maybe an unknown type passed to a callback we're in


## Introduction to Isolation

We usually don't need to disconnect a portion if the cluster is working correctly. The term "portion" here is vague, and can refer to anything from one request with a convoluted payload, to a request whose handler does so many things. Doing many things is not the problem, but the manner in which those things are organised. Below, we will explore ways to segregate functionalities we want to trigger outside their natural habitat.

### Setup scopes

Tests can either have a broad or minimal scope. The scope is determined by evaluating what it'll take to recreate enabling environment for the SUT to run. Its size is relative to the number of dependencies of what is being tested 

Technically, Scopes tackle the [induction part](/docs/v1/appendix/Building-blocks-of-the-testing-chain#the-induction) of the testing chain. This can be as simple as creating parameters for a method and calling it rather than the framework doing that while executing the request. Or, it could involve setting properties the SUT internally uses to certain values. It's convenient to pull dependencies out of the container, but bear in mind that each test should be responsible for controlling the implementation of the dependencies supplied to the SUT, in order to avoid unexpected results

Sometimes, broad scopes disguise behind single methods that execute a great deal of actions underneath. So, you want to ensure a firm understanding of what exactly your setup method does

Broader scopes reduce the quantity of tests you have to write. However, they equally expose you to the risk of brittle tests. The enabling environment/setup internals don't depend on tests, and is thus subject to change at will. Given a broader scope, all the tests relying on that enabling step will also have to be modified, despite the fact that the actual function they verify did not change 

Minimal scopes make for tests that are easier to write, have lesser 
overhead, quicker to run, easier to maintain. When trying to decide between both scopes or setting up a fixture, ask yourself whether the end goal of that setup procedure is long enough to be tested. If it is, extract it to a method. This allows you reduce complexity to a single, testable, reusable, mockable source of truth 

// example of long setup that got delegated to its own test, then a 
protected test trait influencing a similar behaviour to the SUT without rigorously touching the actuals replaced it

// show how changing a part of the long setup only limits the proxy

### Broad request scopes: Divide and conquer

#### Culpable requests

Convoluted payloads are a code smell. This means that if you have the slightest difficulty with writing out the request object your action method is expecting, it's an indication that finer grained control can be achieved by splitting that particular request over multiple, smaller requests; save their state somewhere, continue till the last stage. Multi step forms and lengthy forms, forms with diverse data types (think arrays) are most likely to put you in such position. Defend yourself with drafts or event sourcing. 
Don't allow the monolithic size of the payload obstruct you from testing sections of functionality

It is easy for oversize to sneak through when request objects are auto generated during tests, or in the validation layer (link) due to the fact that libraries written for such purposes provide a wildcard character for describing fields expected to appear repeatedly. If your payloads are being generated, be careful in ensuring repeatable fields are not sent along with regular fields

#### Injecting lengthy parameters

Instantiating a large number of arguments into constructors can get 
tiresome and make the test look unwieldy. This is related to the convoluted payloads problem discussed above and as such, the same manner of approach is recommended. The problem itself may be difficult to spot due to the fact that developers are mostly encouraged to hydrate from the container rather than manually. But if you pay closer attention to some of the calls made to those dependencies, you may observe a trend indicating they should be grouped under the umbrella of another class

// example?

### Isolation strategies

Isolation involves composing our objects in such a way recreate its 
invocation in a state identical to how it would've been called organically. 
If we have 3 methods that receive each number from 1-3, we want to be able to call the second method alone, input our desired digit and confirm it behaves "correctly"

#### Higher order strategy
It isn't always that the entangled piece we want to extract is a method that does one thing. However, There is always an entry point. Identify who eventually invokes that point of interest.

// example of what happens when invocation of the method in question either 
doesn't make semantic sense or won't make observable sense (meaning we'll 
have to go higher?)

#### Isolation by replication
As demonstrated above, either the caller or observer would expect the system to be in a certain state they would've been in if the invocation sequence was followed sequentially. Putting the surrounding environment in this state is known as "fixtures" and is an important aspect of programming itself, and not just testing, because it is its effects that reflects in the ease of tricking our area of interest into thinking it's being called as part of the process it belongs to

// examples of entangled systems preferably in Suphle or anywhere (kaiglo, or try coding up a storm) and how to
1) replicate the surrounding
2) recreate the area of interest without triggering unwanted side effects

#### Isolation by analogy

If in reality, 5 is injected into an internal method that returns 15, but 5 is produced by some internal processes prior to calling that internal method, it is perfectly safe to replace 5 with any other integer, and extrapolate its result with what we expect 5 to have produced

// example 3 input, 9 output

Here, rather than replication, the environment is derived through an analogy

There can be some dilemma between methods concealing variables vital to their inner workings, and ensuring the influential parameters they need to do their work can be supplied externally.

// example

This conflict of interest occasionally presents itself as private methods, fixed values, dates (relative and semantic e.g today) or what have you.

For the first case, employ the "guilty until proven innocent" approach. You can either examine what value the internal operation yields through a debugger, or cook up a fixture for it when required, and subject it to its own test (See [Waylaying strategy](#Waylaying-at-destination)). One of those two methods can be potentially arduous but has the benefit of being automated.

#### Working with dates

As for dates, they should never be defined within the same space where they intend to be used. You have to subtract x days from today in order to pull purchases made on that date. The subtraction and pulling operations should not co-exist. Subtract at one place and inject the target date into fetcher method.

// example of seeding the purchases to a certain date (while organic code 
uses `today`) and sending that to the fetcher

#### Waylaying at destination

This strategy comes in handy when stuck in the "Middle of nowhere" trap. This occurs when the unknown value we want to test is being derived within a crowded scope. It is neither assigned to a property nor returned by the method

// example showing inject, build and derive value x, further processing in this method to arrive at final result, then return

[As has already been said](/docs/v1/appendix/Building-blocks-of-the-testing-chain#the-induction), any value we intend to test has to end up somewhere, otherwise, there simply would be no way to observe it. Wrapping the steps leading up to `x` makes for cleaner code that is ready for reuse. But when that is not possible, hook up a checkpoint wherever `x` is eventually used, with the aid of mocks and spies

// example