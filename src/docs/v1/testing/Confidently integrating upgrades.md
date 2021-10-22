## Confidently integrating upgrades

There is no gain in claiming to assist developers build better software, without guiding them on how best to progressively sustain these systems. 
That can be likened to bringing a knife to a gunfight. As a wise friend once put it, "the devil is in the maintenance. Don't assume knowledge about the full cost of a thing until you understand what maintaining it entails,". It takes special skill to significantly increase or adjust a software's capabilities while keeping the contraption running smoothly, as though it were one uniform block

In reality, replacing parts of what has been built poses the risk of the ensuing void collapsing into a pile of rubble. In this chapter, we'll be looking at strategies for the new addition to dovetail the way it would have, had it been planned along with the original structure. This chapter assumes an already [firm grasp of test automation](/docs/v1/testing/Achieving-test-automation-through-alternative-means)

When delivering a project as a decoupled, composed tree of components, we have nothing to fear while including new features, as long as incoming modifications and the existing project are not interwoven. When they are, it becomes imperative that their **integration** is thoroughly tested.

## DB/Refactoring
We wanna add new columns on our database/model A for module A but don't wanna break the code in other modules reliant on model A. We create model A2 extending model A, add new columns on database, update occurences/type-hints of A in module A to A2. Model A gets discarded whenever its dependents upgrade to A2

