# Testing

## Introduction

Tests are always ordered last in both books and framework documentation, because they don't contribute directly to what end user interacts with. This approach creates so many developers who simply don't know how to automate their tests. It takes the few who have seen first hand through the crystal ball of tests, to appreciate how indispensable it is. It is the only insurance that can give a maintainer the confidence required to alter existing code without fear of damaging other parts of the system. It equally forms the basis of the bravery behind presenting features meeting up to business needs.

Much can be said about providing methods for making testing easier, but very little is said concerning the key thing which is coding standards these methods can be properly applied to. A good, opinionated framework guides its users towards achieving this, rather than leaving them to devote their time to studying such arts.

While TDD advocates may attempt to downplay the tedium of tests, in sincerity, it can take careful commitment to get right, depending on the test type. At the very least, it entails database seeding, mocking object states, and expecting certain outcomes, which is one of the parts we are most interested in. But putting it all together is what distinguishes a codebase one update away from disaster, from another.

Now that we have a solid grasp of the gravity of tests, we may move on to what techniques Suphple provides to aid its developers on this voyage.

## Tests generation

Tests offer confidence when shipping new code but at the cost of additional time and effort. Generated tests are not direct replacement for developers testing their applications in quirky ways unpredictable at scale. But it seeks to leave only edge case tests to the developer.

It mostly works under the premise that the developer adheres to immediate implementation of business requirements rather than TDD.

In order to get a bumper package of feature, integration, and acceptance test cases out of the box, one simply needs to run the nifty command:

```bash
php suphple testgen -case all
```

Over the following sections, we will go into the details of what is being generated.

## Acceptance tests

Suphple ships with a [Codeception](https://codeception.com) adapter with which it uses to connect your endpoints into test cases. However, no assertion is being done or assumed by the framework, since it's only the developer who has an exhaustive business knowledge of his software's intricacies. He is in a better position to assert the expected behavior at those endpoints.

Take a look at a flat route collection such as
///

After the running the `testgen` command, what we get is
///

Even though intent is apparent from written code, the essence of filling up these tests is developer to simply **state a desired outcome and automatedly verify code behavior matches these outcomes**. These kind of verifications are usually very easy -- we want to see certain elements after filling a form to indicate its success; we want to verify logged in users can click certain links and see some information. Codeception makes this a breeze using the following methods
///

Acceptance tests are high-level tests and interact with concrete instances. Let's look at another kind of test very similar in appearance.

## Feature tests 

Suphple uses the following constructs as heuristic to derive what a feature is in your application:

- Flows
- Route collection extension
- Identical inter-module naming conventions
- Logic Factories

### Flows

## Integration tests

This serves to verify success of IO processes or that of those we otherwise don't want to trigger during test runs -- think [events](/docs/v1/events), mail wrappers, [queues](/docs/v1/queue). It could also cut across auxillary activities such as [middleware](/docs/v1/middleware) and [logic factories](/docs/v1/controllers/#logic-factories). If this kinds of operation is minimal in your project, generated integration tests will in turn be few. These sort of tests are meant to function at the service layer i.e. not bound to any endpoints. They should interact more with the [Container](/docs/v1/container). This is where we begin to enjoy the benefits of atomic service methods and the effects of [keeping that layer in a neat shape](/docs/v1/motivation/#goals).

As was mentioned earlier, even though developer glaringly sent out events, the goal here is for them to **verify** it was deliberate. This means that given a service with the following method
///

If we were to generate tests for it, we'd get
///

We are now obligated to collaborate with the framework by filling in the blank spaces to confirm we're all on the same page. Other available methods include
///