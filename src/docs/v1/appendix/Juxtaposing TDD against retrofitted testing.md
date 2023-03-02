## Disclaimer

The discussion here is not intended to stir a controversial debate between TDD/Test-First proponents (abbreviated henceforth as TF), and Retrofitted Testers (hereafter referred to as RTers). Retrofitted Testing is not being imposed as a more superior testing methodology. If you're already comfortable with TF, this chapter may not be of much benefit to you. However, there are some categories of engineers it will appeal to. A few that quickly come to mind are:

- Younger developers stymied by an inferiority complex owing to [their exclusion](/docs/v1/appendix/Transition-from-visual-to-automated-testing#Actual-reasons-tests-are-not-automated) from the TDD bandwagon. My mantra is for them to move onto test automation by any means possible. Once conversant with that, they're more learned to decide on what paradigm suits them better.

- Older developers who are interested in ensuring younger ones are not misled by dangerous heuristics. Those in this category are urged to approach this document with an unbiased mind. If any of the sentiments expressed here are wrong, you're encouraged to dispute them on a new discussion on the [documentation repo](https://github.com/nmeri17/suphle-docs/discussions/new?category=ideas), selecting the labels `appendix` and `retrofitted-testing` to that effect.

## Introduction

The vast majority of automated test study material subscribes to the TDD methodology. Because this paradigm is counterintuitive to learners and beginners, we refrain from promoting it in this Appendix. What is being taught is an opposite methodology whose only goal is test automation and test automation only. We don't really care about 100% coverage scores, tests driving design, the test knowing code outcome beforehand, or any of the other purported benefits of TDD. In this method (hereafter referred to as Retrofitted Testing), we write production code and represent our expectations of it using test observation verifiers.

I don't believe the difference between when the test artifacts are produced are as significant as whether they accurately exercise production code, offering measurable confidence to the authors before release.

## Relevance of retrofitted tests

[tests-code-for-code.jpg](/tests-code-for-code.jpg)

The TDD adherent may wonder the purpose of writing tests after implementation, since production code that tests should have driven has already been written. They suppose one should visually tell whether that code is factual. However, eye tests should only be recommended for verifying that the presentation layer matches the product designer's mockups. One cardinal rule to always bear in mind is that anything executable should not be subject to assumptions, wishes, or eye tests.

This execution happens one way or the other -- be it when that piece of code is eventually run by a real user, or during testing. In this regard, retrofitted tests can be thought of as protection that safe-guards against indiscriminate failure to unexplored parts of the system. Since tests are automated and expected to be replicable (i.e. no random inputs), they not only act as pioneers into those territories, but insurance during upgrades that the system continues to function as intended.

These are direct benefits of automated tests themselves, not retrofitted testing; vindicating the notion that the end justifies the means. The discussion can then shift to which of both means offers a less turbulent experience.

When compared with TF, we can use the analogy of RTers crossing off a checklist of tested implementation, rather than striking them off in parallel. Test-firsters argue that writing only the necessary amount of code to pass a test offers the following perks:

1. Naturally explores all possible code paths, revealing edge-cases of the business requirements that would otherwise have been skipped.

1. Retrofitted testing has a 50/50 chance of the test passing at the first run. When this occurs, depending on the surface area being tested, fishing out the erring components may constitute a challenge -- one that doesn't exist when testing first.

1. Naturally, near or full test coverage.

The word "naturally" is used in this context to signify it being a side-effect rather than an accessory. Granted, the channels to these destinations are not side-effects of practising RT. With this method, the onus is on the tester to pursue them as independent goals. For instance, greater care has to be taken during development, evaluating the implication of the colloboration between vectors involved, double-checking any ambiguity with the product owner. Even after development, the importance of mutation testing supplements such as [Infection](https://infection.github.io) cannot be overstated, for both TF and RT practitioners alike.

To digress a bit, mutation testing is a process of verifying the usefulness of written tests by tweaking parts of the code expected to influence test result outcome. If the test still passes, it indicates the code is surplus to requirements and calls for attention.

The RTer will benefit more from [conducting higher-level tests](#Unit-tests-and-code-coverage), in order to get the most bang for buck when it comes to code coverage. While doing this, the tester should treat the unhappy paths with the same priority as its happy counterpart. An anecdote of this advice is that the developer of a digital mart should verify that while milk can indeed be gotten from the beverage aisle, salads or cosmetics can't be gotten from that same aisle/category. The idea is that every functionality can exist in 3 possible states:

1. Not working (not doing what it's set out to do).
1. Working.
1. Working but permitting absurd behaviour that can be considered ridiculous business-wise.

Depending on feature complexity, there's a finite list of valid combinations that could land the system in the 3rd state, although it's not always possible to identify them all during initial build. At the very least, endeavor to spot those within your power, but don't obsess over it. Depending on the number of resources at one's disposal, some benefits may be derived from devoting time to property-based testing libraries such as [Eris](https://github.com/giorgiosironi/eris). Note that this isn't at the fore-front of the mission to deliver a product meeting given requirements. Rather, they are measures to bolster the standard of the product.

## Generating retrofitted tests

It may seem as though automated tests can be generated after implementation i.e. since developer's intention should be inferred from code. It's a valid argument to have, from the perspective of the code artifact being a source of truth; there's no guarantee that a developer who relays his intent incorrectly in code will do things any differently in the test.

While both are done at the same time and can guarantee the program ~~still~~ works, human-influenced tests exemplify double-entry book-keeping, certifying behavioral change by conscious effort in the test. Should someone unwittingly alter expected behaviour, the code generator detects that execution raised no errors (i.e. it's programmatically functional), but has no say in whether that adaptation is a legitimate one or an oversight.

Except the generator is an AI that understands input on what is required of the underlying system, it can only convert code to tests under the assumption that implemented code is accurate and intended. For instance, we have a method that performs some complex calculations (e.g. computing a shipping price based on factors such as profile history), and returns a value. If this procedure is error-free, a generated test will simply report returned value as correct and pass all its tests.

In order to qualify as a test, at the very least, [an expectation](/docs/v1/Building-blocks-of-the-testing-chain#The-effect) must exist. As expectations are subjective to the test's input, human interference is simply non-negotiable.

One may suggest that simplistic tests verifying status code and shape of the response rather than intimate behavior can be generated. However, the fact that their human-written equivalent is an artifact close to boilerplate casts doubts over the usefulness of such tests, in the first place. That kind of foreknowledge is not valuable to test for the sake of testing.

## Unit tests and code coverage

Unit tests are nearly synonymous with the TDD and test-first concepts, as they can be found at the core of those concepts. One of their major characteristics is in guiding the tester into the system either being built or debugged. However, when the system has already been constructed, what is left is to ensure its parts are correctly integrated, as that would guarantee the individual units are not only applied correctly but function accurately.

Should a defect be detected in the whole, the RTer is expected to embark on a fact-finding mission, de-composing the system by unit testing the individual collaborators surrounding the defect. While adjusting these collaborators to rectify unwanted behaviour, it can possibly reveal and dispel misconceptions previously held regarding them.

While they may not be absolutely necessary from the RTing standpoint, they may be beneficial in the long run. Consider occassions where the constituents outlive their consumer and its high-level test exercising said constituents. Since the contact between test and constituent is indirect, it would mean they are no longer protected below the various advantages of a test. Code coverage reports should be put in place to timely signify these dissenters.

Since implementation wasn't driven by tests, RTs should be combined with [code coverage annotations](https://phpunit.de/manual/3.7/en/appendixes.annotations.html#appendixes.annotations.covers) (e.g. `@covers`), that confirm the test actually strains target SUT, and isn't redundant.

## When to test

Below, we discuss some drivers that determine what part of the development cycle should determine when the RTer tests his implementations.

### Bite-sized driver

This driver dissuades the developer from putting off testing until development of the entire software is complete. The likelihood of . The retrofitted tester should endeavor never to accumulate so much untested code that their eventual testing becomes monotonous and daunting, because the risk of abandoning test automation is higher when that route taken.

Systems under test are usually 3 times bulkier than the code testing them. This means that on average, try not to exceed 3 modified classes or methods before covering those additions in relevant tests. Doing so will equally prevent the tester from losing track of system's intended behavior.

### Exposure driver

There is a limited subset of users who should ever interact with unverified functionality. That list often contains the feature developer and occasionally, his collaborators. This means that whenever your work is to be merged either into master, production, something a teammate should continue from, they least those collaborators can ask for is for it to be stable.

You usually don't want to work for long without frequent pulls, to prevent tedious reviews/merges. Depending on your team's velocity, this driver reminds you not to introduce regressions into teammates' workflows, by testing whatever quantity of modifications have been meted out at your end, prior to its exposure to others.

## Conclusion

Positive side-effects incurred while practising TF explain the reason behind its longevity and widespread usage despite its beginner-unfriendliness. In this chapter, we looked at a number of compromises to be reach so as to enjoy the best of both worlds.