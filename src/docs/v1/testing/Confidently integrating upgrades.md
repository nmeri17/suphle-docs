## Confidently integrating upgrades

There is no gain in claiming to assist developers build better software, without guiding them on how best to progressively sustain these systems. 
That can be likened to bringing a knife to a gunfight. As a wise friend once put it, "the devil is in the maintenance. Don't assume knowledge about the full cost of a thing until you understand what maintaining it entails,". It takes special skill to significantly increase or adjust a software's capabilities while keeping the contraption running smoothly, as though it were one uniform block

In reality, replacing parts of what has been built poses the risk of the ensuing void collapsing into a pile of rubble. In this chapter, we'll be looking at strategies for the new addition to dovetail the way it would have, had it been planned along with the original structure. This chapter assumes an already [firm grasp of test automation](/docs/v1/testing/Achieving-test-automation-through-alternative-means)

When delivering a project as a decoupled, composed tree of components, we have nothing to fear while including new features, as long as incoming modifications and the existing project are not interwoven. When they are, it becomes imperative that their **integration** is thoroughly tested.

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

