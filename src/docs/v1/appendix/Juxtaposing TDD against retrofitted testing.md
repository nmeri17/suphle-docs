## Disclaimer

The discussion here is not intended to stir a debate between TDD/Test-First proponents. It doesn't impose as a more superior testing paradigm. If you already comfortable with TF, this chapter may not be of benefit to you. There are some categories of engineers it will appeal to. A few that quickly come to mind are:

- Younger engineers at cross-roads, stymied by an inferiority complex owing to [their exclusion](/docs/v1/appendix/Transition-from-visual-to-automated-testing#Actual-reasons-tests-are-not-automated) from the TDD band wagon. My mantra is for them to move onto test automation by any means possible. Once conversant with that, they're more learned to decide on what paradigm suits them better.

- Older developers who are interested in ensuring younger ones are not misled by dangerous heuristics. These are expected to approach document with an unbiased mind. If any of the expressed here are wrong, you're encourage to file an issue on the [documentation repo](https://github.com/nmeri17/suphle-docs) to that effect.

## Introduction

The vast majority of automated test study material subscribes to the TDD methodology. Because this paradigm is counterintuitive to learners and beginners, we refrain from promoting it in this Appendix. What is being taught is an opposite methodology whose only goal is test automation and test automation only. We don't really care about 100% coverage scores, tests driving design, the test knowing code outcome beforehand, or any of the other purported benefits of TDD. In this method (hereafter referred to as test after code, or TAC), we write production code and represent our expectations of it using test code. I don't believe the difference between when these artifacts are produced are as significant as whether they accurately exercise production code, offering measurable confidence to the authors before release.

## Relevance of retrofitted tests

The TDD adherent may wonder the purpose of writing tests since the code is already written. They suppose one should visually tell whether that code is factual. However, eye tests should only be recommended for verifying that the presentation layer matches the product designer's mockups. Anything executable should not be subject to assumptions.

An author is justified to automate the confirmation that his work behaves in an intended way. It's like repeating numbers you just listened to for assurance that you heard correctly. The difference between this and a test-driven approach is that this is more of a cross-check whereas with TDD, the checklist is composed and stricken off in parallel.

In both cases, we target the same end goal; however, their paths are 
divergent. TDD approach gives greater coverage while being more verbose –bugs are spotted on the go. So, what happens when a test fails in the code - first approach? Go to the unit layer, and subject the erring component to further scrutiny. Bear in mind that dependencies at this level will be mocked out ie. The base test replaces SUT's dependencies with mocks, so you are free to fill out their blanks.

## Generating retrofitted tests

Retrofitted testing is not the same as using a program to generate test method equivalents of SUT's code. While both are done at the same time and can guarantee the program still (strike through) works, code generation fails to answer the question of regression. Should someone unwittingly alter expected behaviour, the code generator will be unable to identify that. 
Except the generator is an AI that understands input on what is required of the underlying system, it can only convert to tests under the assumption that the developer's logic is accurate and infallible.

## Unit tests and code coverage

Unit tests are not compulsory for retrofitted testers, since it engages the "green" phase of the red-green-refactor chain. In its absence, some behaviours may fortunately work, while others won't. This implies uncertainty at what point of the chain we start at, thus obscuring the hard requirement on unit tests. When we're not incrementally developing ie progress dictated by success of tests of preceding code, we can get away with having no tests at that level if all the internal code paths can be explored by testing objects with greater hierarchy

You are free to pay the unit test price for posterity sake e.g if code making use of that lower level functionality is removed in future. Otherwise, the failing higher test is already a pointer as to whether the lower code behaves as expected. Using mocks in and of themselves doesn't indirectly fix the test

Asserting the same behavior using lesser tests is smart but comes at the cost of an inadequately tested system. TDD doesn't guarantee expansive confidence either. But starting with tests allows for broadly visualising all possible behaviour. This foreknowledge forces the developer to write clairvoyant code that is beyond the peripheral business requirements

In order to bridge this gap, the retrofitted tester should be unsatisfied with asserting their code conforms with the BRD. Since they theoretically have more time on their hands, it should be channelled at pondering what ways the current system could go wrong, and including barriers that account for such situations before a customer performs such action. You may consider consulting with a domain expert so as to avoid making provisions for realistically impossible scenarios. There is a limit to what combination of system states should validly hit your code

While making adjustments to account for irregular behaviour, beware that some parts of the preceding tests may fail. The objective here is for the underlying sut to exist in a homogenous state that satisfies all the tests exercising. Modify it as required

**
How to tell the passing test strains and engages the SUT, not merely providing a false sense of security?

The onus is on the TACer to prove the test won't pass in the absence of the code it's alleged to verify. One construct in place for this confirmation is PHPUnit's `@covers` annotation. Using it will lessen reported code coverage since it focuses surface area being measured to the portion of code specified. It won't throw errors if that code is not actually covered. You'd have to be on the lookout for drops in coverage reports.

Something with more audible alerts is mutation testing frameworks. The concept behind it is verifying the usefulness of written tests by tweaking parts of the code expected to influence test result outcome. If the test still passes then it shows the code inadequately satisfies the test. Mutation tests are a supplement rather than an independent testing framework. The current PHP standard for this supplement is Infection and is recommended for both TFs TACs alike.