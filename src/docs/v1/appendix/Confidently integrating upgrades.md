## Confidently integrating upgrades

There is no gain in claiming to assist developers build better software, without guiding them on how best to progressively sustain these systems. 
That can be likened to bringing a knife to a gunfight. As a wise friend once put it, "the devil is in the maintenance. Don't assume knowledge about the full cost of a thing until you understand what maintaining it entails,". It takes special skill to significantly increase or adjust a software's capabilities while keeping the contraption running smoothly, as though it were one uniform block

In reality, replacing parts of what has been built poses the risk of the ensuing void collapsing into a pile of rubble. In this chapter, we'll be looking at strategies for the new addition to dovetail the way it would have, had it been planned along with the original structure. This chapter assumes an already [firm grasp of test automation](/docs/v1/testing/Achieving-test-automation-through-alternative-means)

When delivering a project as a decoupled, composed tree of components, we have nothing to fear while including new features, as long as incoming modifications and the existing project are not interwoven. When they are, it becomes imperative that their **integration** is thoroughly tested. To be clear, after implementing our shiny new feature, modifying or refactoring an existing one, existing software is bound to break. Have no doubt about it. To be fair, the odds are not entirely 99:1, but they're so negligible that it's more realistic to simply round it off. Your only hope of raising that figure to anything else is by testing it
How do you guarantee new feature functions as intended? (note that this is different from maintaining system equilibrium as was our aim in the previous paragraph). Same way -- testing. There isn't a reality in back end engineering where a developer can escape having verification in place before and after modifying an existing system. You already converted your business expectations into code. Now, you have to programmatically verify that that code indeed does what you intended it to do.

## Issues with launching new features

- The new features were poorly tested

- They were not developed independent of existing system, perhaps because the features are *thought to be* interwoven.

## Delivering related concepts independently

1. Existing code can make futuristic provision for updates with the aid of events and extension rather than direct modification

1. The fresh addition depending on tanglible interaction with the existing codebase can rely on abstractions rather than the concrete

This means what is then tested will be:

|Name |Requirement |When requirement is needed | Test type on requirement|
|-----|------------|---------------------------|-------------------------|
|Existing code|Extend existing parts with new inclusion |When it needs to fetch data from the incoming services. Only modify during slight change |Integration tests |
|Incoming code|Abstraction of existing parts |When we have planned for this first and are now aware of what abstractions need to be made on the existing components |Unit tests with mocks of place of existing. Then integration tests for its own internals|

## Extending, in practice
::: warning
While working on a new feature/module, **never** modify a dependency you rely on to suit your needs. Always always build upon an abstraction layer upon that dependency and inject that in its place. You can always discard the parent version after separately testing with and against the existing dependencies
:::

Maybe use that pastebin to illustrate

## Arranging related features
Though not a strict requirement, it helps if both the extension and integration live in directories sharing the same label. The idea is that even though the additions are separated, their relationship can be easily determined. By pooling geographically different but conceptually similar concepts under the same domain name, we make it easier to associate them during testing. Someone working on the integration bits can intuitively look for the common name across the components. This also enables us centralize our mocking logic for such endpoints


## Refactoring the data layer
We wanna add new columns on our database/model A for module A but don't wanna break the code in other modules reliant on model A. We create model A2 extending model A, add new columns on database, update occurences/type-hints of A in module A to A2. Model A gets discarded whenever its dependents upgrade to A2

## After building-- and an error is spotted

Modules assist in making dependency chains more glaring, but not every component can exist in a modular format

*
When an existing part of the system is discovered to be broken, our aim is to rectify its consumption of the shared service. If the modification substituted existing functionality of the shared service, and the existing code wants to retain its current behaviour, we need to avoid their conflict of interest by moving that functionality elsewhere and redirecting our test to that new sut.If we don't want to retain the current behaviour, we need to bring our test up to speed with the changes propagated by latest additions

If the existing code failed because of an incompatible api, we want to find a common ground between the new and old systems. Rather than unifying their signatures into a longer list of arguments, the dependent method may have to be separated into two distinct methods that trigger an internal, common process

To recap, the first step is to identify what changed on the dependency. That would then inform our reaction either in the failing test, on the dependency, or on the consumer

* intro
One of the biggest pitfalls in software is maintaining projects written by someone else. Things can quickly go south if it was requires significant refractor. You can apply the concept of low coupling using events but without full test coverage, it's impossible to truly tell whether our modification has had adverse effects on an unintended portion of the system.

Our events for non fetches approach serves us for as long as we're not modifying existing behaviour itself but only augmenting it. When the motive is to replace existing behaviour, you still want to make sure nothing will be hurt by testing the system as a whole. This is one of the inspirations for static analysis to be included during server build. Even though it doesn't do much to assure us that contents of the objects we're looking at and behavior of the system is expected, we are 100% guaranteed against pursuing syntactic errors we would otherwise have spotted at runtime.

...
Don't change numerous parts of the system haphazardly so as not to destabilize it or render it unrunnable. A system here can refer to a module or group of collaborating classes that could form an integration test. It can be tricky to edit a system coherently, considering how intertwined implementation of real-life features can be. That's where our [isolatory tactics]() should come to play. They ought to enable incremental modification while maintaining system stability. With the aid of doubles, extensions and mocks, you should be able to break down the bigger picture into smaller units by its areas of impact (AOI). Implement all requirements for each constituent from its little corner, without leaving system worse than you met it or losing ability to test that AOI independently.

After it's all complete, the updated portion can be connected to the main application

**
Features are created as sub-folders within each relevant module