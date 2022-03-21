# In-universe functionality

## Introduction
Suphle's testing framework is a wrapper around PHPUnit, Laravel's testing libraries, as well as abstractions for testing components not existing altogether in both libraries. In this chapter, we will be referencing some methods from both libraries in order to guarantee full coverage of whatever your testing requirements may be.

Suphle has a number of base, low-level test types which most of your tests are expected to extend in place of `PHPUnit\Framework\TestCase` -- specifically, those interacting with modules, the Container, the command console, those fundamental components. If you're simply testing a POPO and can afford to inject its dependencies yourself, using these test types will be unnecessary.

At the bottom of the hierarchy is `TestVirginContainer`. This is where all the other low-level test types extend from

You may be curious as to the reason behind ModuleLevelTest requiring explicit specification of what modules to test, as opposed to say, plugging in `MyApp` directly. What this gives us is the ability to test specific modules before even involving them in the thick of the action