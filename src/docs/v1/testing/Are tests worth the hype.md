## Are tests worth the hype?

Tests are always ordered last in both books and framework documentation, because they don't contribute directly to what end user interacts with. This approach creates so many developers who simply don't know how to automate their tests. It takes the few who have seen first hand through the crystal ball of tests, to appreciate how indispensable it is. It is the only insurance that can give a maintainer the confidence required to alter existing code without fear of damaging other parts of the system. It equally forms the basis of the bravery behind presenting features meeting up to business needs.

Much can be said about providing methods for making testing easier, but very little is said concerning the key thing which is coding standards these methods can be properly applied to. A good, opinionated framework guides its users towards achieving this, rather than leaving them to devote their time to studying such arts.

While TDD advocates may attempt to downplay the tedium of tests, in sincerity, it can take careful commitment to get right, depending on the test type. At the very least, it entails database seeding, mocking object states, and expecting certain outcomes, which is one of the parts we are most interested in. But putting it all together is what distinguishes a codebase one update away from disaster, from another.

Now that we have a solid grasp of the gravity of tests, we may move on to what techniques Suphle provides to aid its developers on this voyage.

It mostly works under the premise that the developer adheres to immediate implementation of business requirements rather than TDD.