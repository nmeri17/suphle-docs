##TESTING

Tests are always ordered last in both books and framework documentation, 
because they don't contribute directly to what end user interacts with. This approach creates so many developers who either don't know how to automate their tests, or lack 
the time to do so. It takes the few who have seen first hand through the 
crystal ball of tests, to appreciate how indispensable it is. It is the 
only insurance that can give a code maintainer the confidence required to 
alter existing code without fear of damaging other parts of the system. It 
equally forms the basis of the bravery behind presenting features meeting 
up to business needs.

Much can be said about providing methods for making testing easier, but 
very little is said concerning the key thing which is coding standards 
these methods can be properly applied to. A good, opinionated framework 
guides its users towards achieving this, rather than leaving them to devote 
their time to studying such arts

While TDD advocates may attempt to downplay the tedium of tests, in 
sincerity, it takes careful commitment to get right. It generally entails 
stubbing method calls, database seeding, mocking object states, and 
expecting certain outcomes, which is the part we are ultimately interested 
in. But putting it all together is what distinguishes a codebase one update 
away from disaster, from another

Now that we have a solid grasp of the gravity of tests, we may move on to 
what techniques Suphple provides to aid its developers on this voyage

Non TDD activists can run php Suphple testgen. With that nifty command, 
they 
get a bumper package of feature tests, integration/http tests, unit tests, 
happy and sad path test cases out of the box!

There may be some criticism surrounding a program's knowledge of written 
software. And to be honest, it's a valid argument. Only the developer has an 
exhaustive business knowledge of his software's intricacies. Suphple merely 
tries to help, by applying heuristics derived from all valid sources fed to 
it

Tests offer confidence when shipping new code but at the cost of additional 
time and effort. Generated tests are not direct replacement for developers 
testing their applications in quirky ways unpredictable at scale. But it 
seeks to leave only edge case tests to the developer
It mostly works under the premise that the developer adheres to immediate 
implementation of business requirements rather than TDD