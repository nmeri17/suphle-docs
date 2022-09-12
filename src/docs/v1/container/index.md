## Introduction

Container pages are not the kind typically visited while perusing documentation. However, understanding what can be achieved with Suphle's container promises to pay huge dividends in the long run. But what is a container and what does it "contain" anyway?

At the most basic level, they are object caches — you store object instances in them so you don't instantiate multiple versions of the same class and have them running all over the place. However, as applications grow more complex, we look onto containers to fulfill needs beyond just object caching, since they are the backbone of every back end framework. They're associated with making concretes out of interfaces, but take care of other details such as conditionally hydrating, decorating and wiring objects. In Suphle, our Container is not one class, but a suite comprising a multitude of components for gaining control in the most elegant manner over what and how objects are fashioned for a caller.

Methods on the main Container class are conceptually divided into two: those for putting things into it, and those for reading those things out of it. Unless you are building developer-facing functionality or writing tests, you aren't expected to need methods in the second category. That said, we will look at the basic capabilities of the container.

## Putting objects into the container

For the record, the container is able to recursively walk object constructors, hydrating type-hinted dependencies all the way. It only needs assistance when a type-hint is an interface. Other times, we may want to inject the instance of a class booted to a desired state. We're not expected to inject primitives since, for them to be dynamic, they have to come from some other source (most often, [the env](/docs/v1/environment)), that should be strongly typed. What we're putting into the container determines how it's being put.

### Providing interfaces

We have different kinds of interfaces in Suphle, but all converge at a central location: `Suphle\Contracts\Hydration\InterfaceCollection`. This class is then connected to its parent module using its `Suphle\Contracts\Modules\DescriptorInterface::interfaceCollection` method like so,

```php

use Suphle\Modules\ModuleDescriptor;

use Suphle\Tests\Mocks\Interactions\ModuleOne;

class ModuleOneDescriptor extends ModuleDescriptor {

    public function exportsImplements():string {

        return ModuleOne::class;
    }

    /**
     * {@inheritdoc}
    */
    public function interfaceCollection ():string {

        return CustomInterfaceCollection::class;
    }
}
```

Suphle already provides a default implementation of this class, `Suphle\Hydration\Structures\BaseInterfaceCollection`, from which you're expected to extend. `InterfaceCollection` exposes methods that describe what kind of interface it is being provided. They all return key-value arrays pairing the interface to the name of a concrete implementation. At the very least, you're going to have an interface collection with a semblance to that below:

```php
namespace Suphle\Tests\Mocks\Modules\ModuleOne\Meta;

use Suphle\Hydration\Structures\BaseInterfaceCollection;

use Suphle\Contracts\Config\{ Router, Events};

use Suphle\Tests\Mocks\Modules\ModuleOne\Config\{RouterMock, EventsMock};

use Suphle\Tests\Mocks\Interactions\ModuleOne;

class CustomInterfaceCollection extends BaseInterfaceCollection {

    public function getConfigs ():array {

        return array_merge(parent::getConfigs(), [

            Events::class => EventsMock::class,

            Router::class => RouterMock::class
        ]);
    }

    public function simpleBinds ():array {

        return array_merge(parent::simpleBinds(), [

            ModuleOne::class => ModuleApi::class
        ]);
    }
}
```

We go into more detail about the kinds of interface in a [later section](/#working-with-interfaces). But for now, let's deal with bind concretes.

### Binding instances

If you transitioned here from front-end development, think of instance binding as the back-end's version of state management. As earlier discussed, Container is a repository of objects floating around in memory. Each of those objects can exist in states differing from what they were when instantiated. Binding of object instances enables us assign objects in these desired states to diverse callers. This means that when hydrating those callers, or when they explicitly request these objects, predefined instances will be handed over to them. This pre-definition is known as *provisioning* while the process of reception by one or more callers is known as *contextual binding*.

Callers can either consume dependencies from their constructors, manually fetching method arguments or using service-location. These methods of consumption (subsequently referred to as contextual-binding), are what determine how an instance would be bound. You would typically bind your provisions before request execution reaches the domain i.e. controller layer and below.

#### Plain provisioning

This is the simplest form of binding and the one you should least likely use. It's intended as the venue for binding object instances critical to module boot process. Objects bound here have global visibility i.e. or else where overridden, they'll be injected to all contexts within that module. This kind of binding is done on the `Suphle\Contracts\Modules\DescriptorInterface::globalConcretes()` method.

```php

public function globalConcretes ():array {

    return array_merge(parent::globalConcretes(), [

        ModuleFiles::class => new AscendingHierarchy(__DIR__, __NAMESPACE__,

            $this->container->getClass(FileSystemReader::class))
    ]);
}
``` 

Every other binding type should be done on `Suphle\Contracts\Modules\DescriptorInterface::registerConcreteBindings` method as follows,

```php

protected function registerConcreteBindings ():void {

    parent::registerConcreteBindings();

    // bind things to $this->container here
}
```

The specifics of how each object is bound within this method depends on the context the object is required in.

#### All method arguments context

Suppose two class signatures define a dependency on a third class in their constructor.

```php

class A {

    private $c;

    public function __construct (C $c) {

        $this->c = $c;
    }
}

class B {

    private $c;

    public function __construct (C $c) {

        $this->c = $c;
    }
}

class C {

    private $value;

    public function setValue (int $value):void {

        $this->value = $value;
    }
}
```

We can instruct the container to provide the same instance of class C to both consumers using a combination of `whenTypeAny()` and `needsArguments()` methods.

```php

protected function registerConcreteBindings ():void {

    parent::registerConcreteBindings();

    $objectInstance = new C;

    $objectInstance->setValue(10);

    $this->container->whenTypeAny()->needsArguments([

        C::class => $objectInstance
    ]);
}
```

`needsArguments()` takes as many provisions as we want, that applies to every other class without an explicit provision. When hydrating arguments for a provisioned type, if any of the dependencies provides its own argument instances, their provided context will take precedence over that of the calling type, recursively.

#### Explicit method arguments context

When we want class `A` to get a separate instance of `C`, we provide that argument like so,

```php

protected function registerConcreteBindings ():void {

    parent::registerConcreteBindings();

    $objectInstance = new C;

    $objectInstance->setValue(10);

    $this->container->whenType(A::class)->needsArguments([

        C::class => $objectInstance
    ]);
}
```

In the above examples, arguments are provided using class types. However, we may want to hydrate an old, untyped class, or a rare case where a class injects two different instances of the same dependency. In such case, we'll resort to a provision using the parameter name. This isn't recommended since it makes the binding resistant to naming refactorings.

#### Service-locator context

This refers to provisions intended for when we [manually retrieve objects from the container](/#Service-location). The same working model described for `whenType()` and `whenTypeAny()` are prevalent here. However, instead of `needsArguments()`, we use the `needs()` method.

```php

protected function registerConcreteBindings ():void {

    parent::registerConcreteBindings();

    $objectInstance = new C;

    $objectInstance->setValue(10);

    $this->container->whenTypeAny()->needs([

        C::class => $objectInstance
    ]);
}
```

These methods return a fluent interface but it may be safer to terminate the end of each entity provision to avoid ambiguity. Any attempt to define a provision without first declaring its context will raise a `Suphle\Exception\Explosives\Generic\HydrationException`. Avoid nesting provisions so as not to encounter unpleasant scenario of outer provision using the inner one.

All provisions are required to be compatible with hydrated type; otherwise, an `Suphle\Exception\Explosives\Generic\InvalidImplementor` exception is thrown.

## Getting objects from the container

Your application is composed of diverse entities serving unique purposes -- controllers, event handlers, middlewares, etc. Over the course of a request, Suphle encounters these objects and attempts to hydrate them for you, first looking for a possible provision before falling back to its default hydration procedure. This process is known as auto-wiring or dependency injection, and absolves you the need to use the `new` keyword except for temporary objects not intended for reuse in another class or management by the container. This shouldn't be some abstract concept only used to intercept request objects in action methods. It should be an integral part of your codebase in order for those dependencies to be easily replaceable during test-doubling, extension and refactoring.

### Service location

With type-hinting in place, there are only a handful scenarios where you'll require manually extracting object instances from the container:

- When building developer-level functionality where it's necessary to pull certain user-land objects. This is evident where we lazily provide a classes' fully qualified name

- When writing tests that seeks to verify a classes' behavior

Regardless of the method used for instructing the container what concrete to return, or whether an entity was provided, at all, we use the central `getClass` to manually obtain or hydrate an instance.

```php

protected function test_class_A_can_foo ():void {

    $sut = $this->container->getClass($this->sutName);
}
```

### Providing super types

Super classes aren't returned when consumers try to pull their sub classes because the container has no way of knowing a sub class exists. However, providing a base class can be served to a known type of consumers. To illustrate, consider the following heirarchy:

```php

class HydratorConsumer {

    protected $container;

    public function __construct (Container $container) {

        $this->container = $container;
    }
}

class UnknownUserLandHydrator extends HydratorConsumer {

    public function getSelfBCounter ():ImmutableDependency {

        return $this->container->getClass(ImmutableDependency::class);
    }
}

class ImmutableDependency {

    public function bar () {

        //
    }
}

class SubImmutableDependency extends ImmutableDependency {

    public function fooBar () {

        //
    }
}
```

Since this is a developer-level facility, `UnknownUserLandHydrator` is unknown at build-time thus, we provision `HydratorConsumer` as follows,

```php

protected function registerConcreteBindings ():void {

    parent::registerConcreteBindings();

    $this->container->whenType(HydratorConsumer::class)->needs([

        ImmutableDependency::class => $objectInstance
    ]);
}
```

We'll end up restricting ourselves from extended, sub-classes on both sides:

1. `HydratorConsumer` is stuck with a binding to `ImmutableDependency`. It's never aware of `SubImmutableDependency`.

1. The provisions made on `HydratorConsumer` go past `UnknownUserLandHydrator` without any effect.

The first problem is more well-known, so it's used here to illustrate the second one. It exists because hydration would take much longer if parent provisions are additionally evaluated. Dependency Inversion principle teaches us that high-level modules are prohibited from depending on concretions but should use abstractions, instead. With the simple adjustment:

```php

class ImmutableDependency implements ImmutableClientContract {

    public function bar () {

        //
    }
}
```

When `ImmutableClientContract` is type-hinted, its concrete bound through [the instructed channel](/#working-with-interfaces) is what will be served. Those channels are all 1-1 pairings between interface and concrete; which also means some base class like a collection can't bind dependencies for a variable group of sub-classes.

In some frameworks, this is solved using container tags. We don't use those in Suphle due to our emphasis on connecting entities to their fully qualified names rather than random strings. What we want to do is to access the parent entity's provision, and that is done using the 2nd argument to `getClass()`. If we slightly adjust `UnknownUserLandHydrator` as follows:

```php

class UnknownUserLandHydrator extends HydratorConsumer {

    public function getSelfBCounter ():ImmutableDependency {

        return $this->container->getClass(ImmutableDependency::class, true);
    }
}
```

## Working with interfaces

We have different ways of hydrating concrete interfaces in Suphle, depending on what purpose the interface is intended for.

### Config interfaces

In Suphle, component configs are contracts between the component and consumer. They are distinguished from other interfaces by extending `Suphle\Contracts\Hydration\ConfigMarker` and live on method `Suphle\Contracts\Hydration\InterfaceCollection::getConfigs()`. For example, the signature of the router config bears semblance to this:

```php

interface Router extends ConfigMarker {

    public function apiPrefix ():string;
}
```

They should be predominantly used on the library developer side, but with an extendable default provided. As much as possible, endeavor to exempt logic or computation from config classes. They are a polyfill for the specification "readonly, type-safe".

### Interface loaders

This is all about pointing interfaces to concretes that should be booted into a usable state before being injected. This is more likely to occur during use of adapter interfaces pointing to 3rd-party libraries. It enables us centralize initialization of the libraries such that:

- Library entry point can be easily replaced.

- Libraries' booting phase can be edited to conform with the underlying specifics.

Interface loaders are expected to extend `Suphle\Hydration\BaseInterfaceLoader`, and are connected to the framework through the `Suphle\Contracts\Hydration\InterfaceCollection::getLoaders()` method.

#### Defining library entry point

Suppose our adapter has a loader `CProvider`, its entry point will look like so:

```php

class CProvider extends BaseInterfaceLoader {

    public function concreteName ():string {

        return CConcrete::class;
    }
}
```

The class returned from `BaseInterfaceLoader::concreteName()` is the primary class Suphle will hydrate for this interface and is expected to be one of its implementations.

#### Booting the library

```php

class CProvider extends BaseInterfaceLoader {

    public function afterBind ($initialized):void {

        // trigger functionality on $initialized
    }
}
```

`BaseInterfaceLoader::afterBind()` personifies the essence of interface loaders. It receives the freshly hydrated instance of given entry point, but relevant classes can equally collaborate here to meet consuming client's expected state. As with all interfaces, the consuming client only cares about functionality declared on the signature, not initialization details.

#### Entry point arguments

These are analogous to providing the [arguments context](#All-method-arguments-context)
    public function bindArguments ():array {

        return ["value" => 10];
    }
We use this method to obscure away instantiation details from an interface's consumer -- which they shouldn't be bound to. Any arguments required by the given constructor are described here.

Of course, when providing interfaces, there are no constructor methods to fill. The key/value expected to populate this array is a blank cheque matching whatever parameters are required to instantiate the concrete being supplied
///
Show example


public function simpleBinds():array;

### Namespace Rewriting

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

In such cases, Suphle's container handles it by proxying calls to the first consumed of both classes. But not without raising a `E_USER_WARNING` that will be caught by your logger if you have any listening

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

(can't depend on dependency's concrete) it may be lurking in afterBind, not just in the constructor

ModifyInjected is subdivided into two handler kinds:
- Those that modify decorated instance without calling it
- Those that call decorated instance

Combining A cocktail of decorators with handlers that trigger underlying concrete will result in a disaster. In such cases, ambiguity will be removed by executing the cross-cutting method in a converging handler

(module class binding method)
Careful to decouple dependencies during binding. Starting a bind call within another will confuse the outer one
// example

## Testing

telescope