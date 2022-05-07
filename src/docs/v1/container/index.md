# Containers

Container pages are not the kind typically visited while perusing documentation. However, understanding what can be achieved with Suphple's container promises to pay huge dividends in the long run. But first of all, what is a container, and what does it "contain", anyway?

## Introduction
At the most basic level, they are object caches — you store object instances in them so you don't instantiate multiple versions of the same class and have them running all over the place. As applications grow more complex, we look onto them to fulfill needs beyond just object caching.

Containers are the missing feature of every back end language. They are associated with making concretes out of interfaces but take care of other details such as conditionally hydrating, decorating and wiring objects. In reality, Suphple's Container is not just one class, but a suite comprising a multitude of components for gaining control in the most elegant manner over what and how objects are fashioned for a caller.

One characteristic of a good back end framework is that its container is both versatile and powerful enough for the developer to never pull objects out of it directly. This means methods on the main Container class are conceptually divided into two: those for putting things into the Container, and those for reading those things out of it. Unless you are building developer-facing functionality, you aren't expected to need methods in the second category. To that effect, we will first look at put related methods, read methods, then the other capabilities of this component

*Start from put*

## Auto-wiring and dependency injection

In practice, this refers to the process of type-hinting class constructors or specific methods of certain interfaces in order to reference predefined entities. These entities could be anything from interfaces to base types or primitives. The important takeaway is that developer doesn't get to use the `new` keyword or instantiate the constructor's arguments prior to their introduction into the required class.

Auto-wiring is not some abstract concept only used to intercept request objects in action methods. It should be part and parcel of your codebase in order for those dependencies to be easily replaceable during mocking, extension and refactoring.

- `getClass`

Suphple internally uses this method to hydrate entity instances. Those entities will usually rely on types that are either [provided](/docs/v1/service-provision) before the entity requests for them, or are instantiated at runtime. If you refer to the diagram in the [Basics](/docs/v1/basics/#anatomy-of-a-suphple-module), the numbered segments excluding 1, 2, and 7 all have auto-wiring enabled on their constructors. This implies you would hardly ever have the need to use this method directly. However, understanding how it works may prove beneficial in the way your object signatures are defined.

/// Describe the fresh instance steps

## Sub-provisions and super types
Super classes aren't returned when consumers try to pull their sub classes because there's simply no way for the container to know a sub exists, given the way objects are being stored for fast retrieval i.e. direct lookup. However, providing base classes can be served to a known type of consumers. 
To illustrate, consider (convert this to code) X is a sub-class of Y, B is the sub of A

1) A pulls X --> only works if A provided X
2) B pulls Y --> works if A provided Y

In order to achieve first scenario, convert Y to an interface and provide X as an implementation
///

The second scenario is useful when a variable group of classes with a base type need to provide an immutable or unchanging instance. In cases where this behavior is desirable, you will be better served by using the `sub` parameter
///

:::info
Service locator is widely considered an anti-pattern. But it does have a few good use cases. In a framework like Suphple, where some core classes exist outside the context of containers — classes managing even containers themselves — the only way to interact with contextual versions of certain classes is by use of a service locator. Another use case is while trying to lazy load or perform actions on an object lazily. While it's not expected to be used in user land, it might be the key to solving not just the two situations above, but accessing variable classes defined in user-land from either a package being developed or a test
:::

## Contextual Binding
If you are transitioning from front-end development, think of this as the back-end's version of state management. As earlier discussed, the Container is a repository of objects floating around in memory. Each of those objects can exist in states differing from what they were when instantiated. Contextual binding enables us assign objects in these desired states to diverse callers. This means that when hydrating those callers, or when they explicitly request these objects, predefined instances will be handed over to them. This *pre-definition* is known as object/service **provisioning**. There are a few ways to provision objects, either depending on how you intend the caller receives the object, or [when object should be hydrated](/docs/v1/service-providers).

Callers can either consume dependencies from their constructors or by directly invoking [`getClass`](#auto-wiring-and-dependency-injection)

// example
In both scenarios, the desired outcome can be different. As earlier mentioned, Suphple internally makes heavy use of calls to `getClass`, so you don't have to unless you are a [plugin developer](/docs/v1/plugins). It's mostly an avenue to replace the regular hydration of those classes.

- `whenType(string ConsumerClass)`

This is the genesis of all contextual binding. The type being provided is supplied, and a fluent interface is returned for definition of the dependencies.

[[Review]] Bear in mind that while hydrating arguments for a provisioned type, if those any of the arguments were equally provisioned, their provided context will take precedence over that of the calling type

/// Example

- `whenTypeAny()`

Equally functions as `whenType`, however, it enables this definition to apply to every other class that wasn't provided. When a class provisions some classes in a list, then attempts to get some other classes outside that list, the container fallsback to global provisions made using `whenTypeAny()`

- `needs(array types)`

In order to directly influence `getClass` return value on a per-caller basis, the desired concrete must be provided to it through this method
/// Example

Notice it works with `whenType`. Calls to any of the `needs` methods without first defining what type is being provided will result in a `HydrationException`.

The above invocation may be familiar to those who have heard of the term Service-Location.

When using either `needs` or `needsAny`, none of the concretes can correspond to one bound to an interface through any subclasses of `BaseInterfaceCollection`. It doesn't make sense to provide such concretes. When the Container encounters such scenarios, it skips the provision and creates a fresh concrete

## Namespace Rewriting

- `whenSpace`
An incorrect use of interfaces is for converting all injectable services into contracts. This method is not intended for such purpose.
An indication that an interface is ripe for creation is when more than one concrete implementations are available to consume it. A good rule (///link) says three. This situation could arise during a refactor. Refactoring occurs in various forms, one of which this method is primarily for

Suppose a new business requirement affecting a number of our services is presented, as has been encouraged several times in this documentation, one should retain old implementations while developing the new. Taking that a step further, multiple services may be in the same situation, perhaps during a refactor to classes affected by a cross-cutting concern. Rather than individually bind each concrete to its desired consumer, we use `whenSpace` to consistently point them

Modules\CartModule\Controllers\CarController
Modules\CartModule\Contracts\ICarService // or CarService
Modules\CartModule\Services\CarServiceImpl //


## Circular dependencies
These are usually a code smell; which is why most containers crumble when these are thrown at them. Logical flow ought to be composed in a hierarchical manner that expresses the lower level elements as entirely oblivious of their higher level counterparts. Service return values should be collated at a central point such as the controller and sent to evaluating service. Such situations are usually an indication that some part of those services should exist on their own. This enriches the application with a decoupled dependency chain, and by extension, testability.

That said, "tell, don't ask" principle may appeal to some, and services can wind up in the constructor of their own dependencies. For instance, it may be undesirable to retrieve values from service x and plug into y

// show example of chatty controller vs passing the entire service to that guy for it to select the properties/methods it wants

In such cases, Suphple's container handles it by proxying calls to the first consumed of both classes. But not without raising a `E_USER_WARNING` that will be caught by your logger if you have any listening

```php

class A {

    function __construct(B $foo) {
        dump($foo);
        // $this->foo = $foo;
    }
}
```

```php

class B {

    function __construct(A $foo) {
        dump($foo);
        // $this->foo = $foo;
    }
}
```

## Caveat
The fact that concretes are decoupled from their interfaces makes the likelihood of one concrete unwittingly referring to an interface whose concrete, in turn, refers to it high. Bear in mind that proxying interfaces is different from concretes since it has methods that need implementations.

When this is the case, the container won't proxy calls to the interface. Even though it's possible to extract and wrap their concrete on the fly, the overhead and sheer *sorcery* of such an implementation deviate too far away from the language's expected behaviour, for very little benefit, as such, going against one of Suphle's core principles. That said, when Container encounters such concretes, it will throw a `HydrationException`

As with all problems in this category, the solution is to breakdown the intertwining bits either into a third, decoupled entity; or, to defer evaluation of the *lesser* of both dependencies

***
Ensure you know what you're doing when using `refreshClass`. It will recursively wipe all objects where given target was injected by container. This includes all of their provisions. Mention the caveat of using `ClassHydrationBehavior`

(can't depend on dependency's concrete) it may be lurking in afterBind, not just in the constructor (goes to container)