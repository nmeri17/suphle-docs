# Building blocks of the testing chain

## Introduction
This chapter seeks to address any confusion surrounding what automated tests look like. Its intended for an audience who have no clue about where to start automating their tests from. 

Every test represents cause and effect. If someone makes a sound, you hear it. Tests are similar to the way your sense organs work. The tester induces an effect he wants to observe, and describes an outcome that'll determine whether or not the induction yielded an expected effect. The effect could be anything from an event's occurrence, to an event /not/ occuring

For every event, there is an object. Just as in grammar, where verbs are actions that happen to nouns, no event can be monitored in isolation – it must happen to someone or something. Now, we have an observer, an induction, an object, and an effect (or series of effects) being observed. 
With the last three combined, you have a complete test! We'll go over two of the most important, then wrap it all up

## The induction
In coding terms, an induction refers to any action performed on the object being observed. It could be a method call or property assignment on that object. As long as the object participates in something after its inert state, that counts as an induction

// examples

If Those look familiar, it's because you've been doing them your whole life. In practice, the induction may not always be as straightforward as instantiating objects and calling their methods. Those methods may rely on reference properties to follow paths we want to eventually observe

// example

Some other times, the object needs to collaborate with guardians or 
managers, as its own invocation won't make thematic sense in the bigger picture. This is discussed in more detail in the chapter covering [isolation techniques](/docs/v1/testing/Achieving-test-automation-through-alternative-means#isolation-strategies)

## The effect
What did the object do after its induction? Did it return a value? Did it change a property on some other object (s)? Did it send a mail or trigger an alarm? What is the side effect of our object's induction?
Just as there is no event without an object, so also must there be an observer to examine consequences of that event in a test

// examples of event and observation only

For each kind of event, there is an equal and opposite method of 
observation. You aren't mandated to cram methods you don't need yet.

## Putting it together
The two things to bear in mind while building your tests:
    - What do I need to have in place before calling this method?
    - What are my expectations after calling this method and what are their test equivalents?

Sometimes, the object being induced can be different from the one the effect has to be observed on. Other times, they may be the same. The first thing you want to do is identify both

// pick an example from the first section and annotate it according to the 
above

Next comes the easy part, "how do we observe the subject?"

// complete example

That's it, your delicious test is ready to serve! 
