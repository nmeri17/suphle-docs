## Introduction

Tests are always ordered last in both books and framework documentation, because they don't contribute directly to what end user interacts with. This approach creates so many developers who simply don't know how to automate their tests. It takes the few who have seen first hand through the crystal ball of tests, to appreciate how indispensable it is. It is the only insurance that can give a maintainer the confidence required to alter existing code without fear of damaging other parts of the system. It equally forms the basis of the bravery behind presenting features meeting up to business needs.

Much can be said about providing methods for making testing easier, but very little is mentioned concerning the key thing which is coding standards these methods can be properly applied to.

While some TDD adherents may attempt to downplay the tedium of tests, in sincerity, it can take careful commitment to get right, depending on the test type. In some cases, it can entail database seeding, mocking object states, and expecting certain outcomes, which is one of the parts we are most interested in. But putting it all together is what distinguishes a codebase one update away from disaster, from another.

The essence of these steps is not because automated testers are masochists. Where necessary, each of them is deployed toward the common goal of simulating behavior of the code under the test, in production. It's not magical that tested code is more resilient, more reliable than its alternative, gives its maintainers greater confidence, etc. The simple change with a world of difference is that one of those codebases has been exercised by the developer in a replicable way, while the other is left to the fate of the app's user.

Assuming a program may work in their absence is analogous to an actor's absurd assumption that they'll get the stunt right in one take