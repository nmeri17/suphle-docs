## Introduction

This chapter seeks to address any confusion surrounding what automated tests look like. It's intended for an audience who have no clue about where to start automating their tests from. 

To begin, we must share the understanding that all tests are governed by the basic premise of cause and effect. If someone makes a sound, you hear it. Tests are similar to the way your sense organs work: The tester [induces](#The-induction) an effect he wants to observe, and *describes* an outcome that'll determine whether or not the induction yielded an expected effect.

- The effect could be anything from an event's occurrence, to an event **not** occuring.
- The description is automated using programmatic translations of business rules that would've been written in English grammar (or your native language).

For every event, there is an object. Just as in grammar, where verbs are actions that happen to nouns, no event can be monitored in isolation – it must happen to someone or something. Now, we have an observer, an induction, an object, and an effect (or series of effects) being observed. 
With the last three combined, you have a complete test! We'll go over two of the most important, then wrap it all up.

## The induction

In coding terms, an induction refers to any action performed on the object being observed. It could be a method call or property assignment on that object. As long as the object participates in something after its inert state, that counts as an induction.

```php

class NumericOperations {

    public function subtractNumbers (int $b, int $a):int {

        return $b - $a;
    }
}
```

```php

// in some consumer
$operation = new NumericOperations;

$sum = $operation->subtractNumbers(23, 18); // the induction occurs here
```

If the above statements look familiar, it's because you've been doing them your whole life. In practice, the induction may not always be as straightforward as instantiating objects and calling their methods. Those methods may rely on instance properties referring to stateful objects, to follow paths we want to eventually observe.

```php

class RealLifeService {

    public function __construct (

        protected readonly ComplexDependency $dependency,

        protected readonly DirectionIndicator $indicator
    ) {

        //
    }

    public function fetchValue ():ValueDTO {

        if ($this->indicator->turnsRed())

            return $this->dependency->deriveOldValue();

        return $this->dependency->processNewValue();
    }
}
```

```php

class SomeCoordinator {

    public function __construct (

        protected readonly RealLifeService $amazingDependency
    ) {
        //
    }

    public function actionHandler ():iterable {

        return [

            "data" => $this->amazingDependency->fetchValue() // induce execution of that functionality
        ];
    }
```

Some other times, the object needs to collaborate with guardians or 
managers, as its own invocation won't make thematic sense in the bigger picture. This is discussed in more detail in the chapter covering [isolation techniques](/docs/v1/appendix/Transition-from-visual-to-automated-testing#unit-isolation-strategies). In the interim, it suffices to know that inducement in this context refers to the act of **triggering** some effect, behavior or functionality we intend to observe.

## The effect

What did the event do after its induction? Did it return a value? Did it change a property on some other object(s)? Did it send a mail or trigger an alarm? What is the side effect of our event's induction?

Just as there is no event without a subject, so also must there be an observable entity enabling us examine consequences of that event. The most naive observation that can programmatically be carried out are those done with comparator operators: `==`, `>`, `<=`, etc.

Building upon our `NumericOperations::subtractNumbers` example above, a simple observation would seek to verify that the result of our operation matches an expected outcome:

```php

$operation = new NumericOperations;

$sum = $operation->subtractNumbers(23, 18);

$subtractsCorrectly = $sum === 5; // the observation
```

Each kind of event has a [corresponding programmatic method](/docs/v1/appendix/Transition-from-visual-to-automated-testing#Literal-equivalent-identification) of observation. You aren't mandated to cram methods you don't need yet.

## Combining event induction and observation

Here, we're speaking in testing terms. This two must come together in order to make a test complete. The primary questions to answer while building your tests are these:

1. What conditions do I need to have in place before calling this method (or inducing this observable event)?

1. What are my expectations after calling this method and what are their test equivalents?

1. How do we observe the subject?

For our simplistic `NumericOperations::subtractNumbers`, we may not need any pre-conditions to observe the effects of inducing a subtraction operation. But we do need its programmatic comparator to terminate test execution if expected condition is not met.

```php

use Suphle\Testing\TestTypes\IsolatedComponentTest;

class FirstCustomTest extends IsolatedComponentTest {
    
    public function test_num_add_operation () {

        // no "given" since we have no pre-condition

        $sut = new NumericOperations;

        $sum = $sut->subtractNumbers(23, 18); // when
        
        $this->assertSame($sum, 5); // then
    }
}
```

That's it, your delicious test is ready to serve! 

Sometimes, the object where an event is being induced from will be different from the one the effect has to be observed on. Other times, they may be the same (as we saw in the `FirstCustomTest::test_num_add_operation` example). Identifying both will inform the tester of all participants in the test.

Take for instance, the definition of `RealLifeService`; suppose `ComplexDependency` is a library whose methods have been tested, and we want to test its integration with `RealLifeService` i.e. that returned value is indeed derived from `ComplexDependency::deriveOldValue` only when `DirectionIndicator::turnsRed`, we can be said to have a pre-condition the system must satisfy to be in a state that forces execuion down the path we intend to observe.

There are [a few ways](/docs/v1/testing#Reading-from-active-Container) to put collaborators in desired states, depending on the object design of said collaborator. However, for the purpose of this illustration, we'll stub that method.

```php

use Suphle\Testing\TestTypes\IsolatedComponentTest;

class SecondCustomTest extends IsolatedComponentTest {
    
    public function test_red_light_gets_old_value () {

        $sut = $this->replaceConstructorArguments(

            RealLifeService::class, [

                DirectionIndicator::class => $this->positiveDouble(DirectionIndicator::class, [

                    "turnsRed" => true // given
                ]),
                ComplexDependency::class => $this->positiveDouble(ComplexDependency::class, [], [

                    "deriveOldValue" => [1, []], // then

                    "processNewValue" => [0, []]
                ])
            ]
        );

        $sut->fetchValue(); // when
    }
}
```

Note that `RealLifeService`, above, is used for illustrative purposes. In the real-world, your tests will be more valuable when they verify some complex behavior not so vivid to the naked eye as one conditionals change in path.

When `SecondCustomTest::test_red_light_gets_old_value` passes, it acts as a guarantee that not only does the system work as intended, but that unwitting or accidental modification interferring with that expectation is caught before the software reaches its consumers. Where this modification is actually intentional, the test would have served its purpose and should be replaced by a new one covering the newly included functionality or expectation.

Sometimes, the functionality you intend to test is a Framework-aware behavior; in which case, it may be more expedient to be assisted by the framework-provided constructs put in place for testing those features. While testing [events](/docs/v1/events), for instance, you're not expected to verify your listeners were called using mocks. While that would equally work, framework-provided constructs are intended as conveniences that simplify the DSL in question, thereby aiding readability, and save you from the low-level details of wiring test doubles, so you can focus more on inducing the action itself.

Do refer to each chapter of this documentation covering user-facing functionality to consult with their testing components.