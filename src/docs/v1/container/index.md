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

Suppose a class defines a dependency on another class in its constructor:

```php

class A {

    public function __construct (protected readonly C $c) {

        //
    }
}

class C {

    private $value;

    public function setValue (int $value):void {

        $this->value = $value;
    }
}
```

We can instruct the container to provide the same instance of class `C` to every consumer who requests for it, using a combination of `whenTypeAny()` and `needsArguments()` methods.

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

We my also want to limit access of a class instance to one consumer. Say, we want only class `A` to get this specific instance of `C`; all other consumers should hydrate `A` afresh. That binding can be provided as follows:

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

#### Global singletons

When objects are being hydrated, the container will find an available provision for the context it's hydrating for, and will latch onto one when found. Along recursive or lengthy dependency chains, this means some dependencies will be hydrated afresh since they weren't explicitly provided for that consumer. This can become a problem when dependency has been booted to a state that should be visible across its consumers.

In such case, we want all consumers to receive the same instance regardless of their position during a hydration sequence. An app-wide instance of an dependency can be created by decorating it with `Suphle\Contracts\Services\Decorators\BindsAsSingleton`.

```php
use Suphle\Contracts\Services\Decorators\BindsAsSingleton;

class C implements BindsAsSingleton {

    private $value;

    public function setValue (int $value):void {

        $this->value = $value;
    }

    public function entityIdentity ():string {

        return static::class;
    }
}

class B {

    public function __construct (protected readonly A $a) {

        //
    }
}
```

Now, no matter how deep the nesting the dependency on `C` is, an identical instance will be given since it's only hydrated once. `BindsAsSingleton::entityIdentity` is used to indicate what capacity this object should be applied to. Objects [implementing interfaces](#providing-interfaces) will be more inclined to return the primary interface for which they were written, while classes can merely return their own names.

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

    public function __construct (protected readonly  Container $container) {

        //
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

### PHP 8 new types

This version of the language introduced union and intersection types. Unfortunately, they are unsupported by Suphle's Container type reader. The sort of ambiguity they come with encourages equivocal APIs which isn't in line with our objectives. PHP 8 equally introduced enums. As they're not instantiable, consumers ought to bind a default enum entry for each object where it's typed and expected to be hydrated by the Container.

## Working with interfaces

We have different ways of hydrating concrete interfaces in Suphle, depending on what purpose the interface is intended for.

### Config interfaces

In Suphle, component configs are contracts between the component and consumer. They are distinguished from other interfaces by extending `Suphle\Contracts\Hydration\ConfigMarker` and live on method `Suphle\Contracts\Hydration\InterfaceCollection::getConfigs()`. For example, the signature of the router config bears semblance to this:

```php

interface Router extends ConfigMarker {

    public function apiPrefix ():string;
}
```

They should be predominantly used on the library developer side, but with an extendable default provided. As much as possible, endeavor to exempt logic or computation from config classes.

Suphle's config interfaces describe settings as methods that return values. This style is used as a polyfill for the specification "readonly, type-safe". Although PHP 8 introduced properties matching this specification, they also came with a whole bag of headaches -- from readonly setting scope being limited to the definition class, to such signature requiring all config classes have their settings injected as constructor arguments, to issues associated with redefinition in child classes.

Nevertheless, if that experience appeals to you, your config classes can make use of it.

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

```php

class CProvider extends BaseInterfaceLoader {

    public function bindArguments ():array {

        return ["value" => 10];
    }
}
```

We use `BaseInterfaceLoader::bindArguments()` to obscure away instantiation details from an interface's consumer -- which they shouldn't be bound to. Any arguments required by the given constructor are described here. They are analogous to providing the [arguments context](#All-method-arguments-context), but specifically for the entry class.


### Binding regular interfaces

This refers to every other interface that doesn't fall into the categories listed above. They are stored as a key-value pair of interface-concrete in `Suphle\Contracts\Hydration\InterfaceCollection::simpleBinds()`. The typical usage is expected to override or include entries into `Suphle\Hydration\Structures\BaseInterfaceCollection`.

```php

class CustomInterfaceCollection extends BaseInterfaceCollection {

    public function simpleBinds ():array {

        return array_merge(parent::simpleBinds(), [

            MyInterface::class => ItsConcrete::class
        ]);
    }
}
```

### Namespace Rewriting

An incorrect use of interfaces is for converting all injectable services into contracts. An indication that an interface is ripe for creation is when more than one concrete will or does implement it.

Suppose a new business requirement affecting a number of our services is presented, as has been encouraged several times in this documentation, one should retain old implementations while developing the new. Taking that a step further, multiple services may be in the same situation, perhaps during a refactor to classes affected by a cross-cutting concern. Rather than individually bind each concrete to its desired consumer, we use `Container::whenSpace()` method to redirect interfaces under one namespace to concretes in another.

```php

use Suphle\Hydration\Structures\NamespaceUnit;

protected function registerConcreteBindings ():void {

    parent::registerConcreteBindings();

    $modulePath = "Modules\CartModule\\";

    $this->container->whenSpace($modulePath . "Concretes")

    ->renameServiceSpace(new NamespaceUnit(

        $modulePath . "Interfaces", $modulePath . "Concretes\V2",

        function (string $contract) {

            return $contract . "Impl";
        }
    ));
}
```

With the above configuration, whenever a class resident within `Modules\CartModule\Concretes` namespace attempts to load interfaces originating from `Modules\CartModule\Interfaces`, the container will attempt to find the matching concrete using the value returned from the callback; in this case, translating to the namespace `Modules\CartModule\Concretes\V2`.

In the example given above, it's expected that concrete names mirror their interface names, along with the suffix "Impl". Other common patterns that work as suffixes are trimming off a preceding *I* or *Interface* such as from *ICarService* or *CarServiceInterface* respectively.


## Dealing with circular dependencies

These are usually a code smell; which is why most containers crumble when these are thrown at them. Logical flow ought to be composed in a hierarchical manner that expresses the lower level elements as entirely oblivious of their higher level counterparts. Service return values should be collated at a central point such as the controller and sent to evaluating service. Circular dependencies is a predicament indicating that some part of those services should exist on their own. This enriches the application with a decoupled dependency chain.

In some cases beyond our control, services can wind up in the constructor of their own dependencies. In such cases, Suphle's container will hydrate it without additional configuration. But not without raising a `E_USER_WARNING` that will be caught by your logger if you have any listening.

```php

class A {

    public function __construct(protected readonly B $classB) {

        //
    }
}

class B {

    public function __construct(protected readonly A $classA) {

        //
    }
}
```

Aside from loggers, ny environment with `strict_type=1` would halt on encountering this warning.

### Circular-dependencies caveat

The fact that concretes are decoupled from their interfaces makes the likelihood of one concrete unwittingly referring to an interface whose concrete, in turn, refers to it high. Bear in mind that proxying interfaces is different from concretes since it has methods that need implementations.

When this is the case, the container won't proxy calls to the interface. Even though it's possible to extract and wrap their concrete on the fly, the overhead and sheer *sorcery* of such an implementation deviate too far away from the language's expected behaviour, for very little benefit. Doing so goes against one of Suphle's core principles. That said, when Container encounters such concretes, it will throw a `Suphle\Exception\Explosives\Generic\HydrationException`.

As with all problems in this category, the solution is to breakdown the intertwining bits either into a third, decoupled entity; or, to defer evaluation of the *lesser* of both dependencies. One surprising situation where this problem arises is during the use of interface loaders. While working with them, there are a few advice that may be helpful:

- You have two interfaces; their respective concretes are prohibited from depending on the other's interface.

- Circular dependencies is not a phenomena limited to constructor. It can be witnessed anywhere from method signatures to `Suphle\Hydration\BaseInterfaceLoader::afterBind()`. Be on the lookout for locations involving hydrating things. If one of the dependencies contains a reference to the caller, it requires our attention.

## Removing things from the container

Objects put into the container can grow stale in-between reads. When this happens, not only should the object be wiped from memory, but every other consumer holding those deprecated instances should equally be evacuated otherwise, we'll be working with outdated data. We use the `Container::refreshClass($className)` method for this.

It will recursively wipe all objects where given target was injected by container along with all of their provisions. This effect is rarely intended in user-land, so you may want to double-check there's no better alternative to what you're trying to achieve before using it.

When evicting multiple classes at the same time, their names can be passed to `Container::refreshMany`.

```php

$container->refreshMany([ClassA::class, classB::class]);
```

### Stickying objects

Some class instances contain vital references or data whose eviction would cause more harm than good. For such classes, we'll want to protect them by implementing `ClassHydrationBehavior`.

```php
use Suphle\Contracts\Hydration\ClassHydrationBehavior;

class AbsolutelyCritical implements ClassHydrationBehavior {

    public function protectRefreshPurge ():bool {

        return true;
    }
}
```

Above we use `protectRefreshPurge()` as contraceptive against recursive sanitation.

## Object decoration

This refers to a process of either augmenting how the container hydrates an object or wrapping the class as a whole with additional behavior not relevant to its actual functionality, as it relates to request handling. It's a distant relative to middlewares but gives more granular control.

### Consuming a decorator

All that is required for this is to apply the decorator as a PHP 8 attribute.

```php

#[SomeDecorator]
class ConsumingClass {

    //
}
```

Often, this decorator would receive relevant information to be applied for the consuming class from its definition.

```php

#[SomeDecorator("itsArgument")]
class ConsumingClass {

    //
}
```

If you're not rolling out custom decorators, this is all you need to know.

### Writing your own decorators

While writing custom decorators may sound like a whole lot of fun, do take note of the following words of advice:

- A decorator should not be useful to only one type. In such case, outsource that functionality to a single manager class, inject your target/pre-known type, and work with that.

- Consider whether the functionality you're trying to implement can be evaluated outside the context of a user-initiated request. When this is the case, consider delegating it to compile-time activities run during server start-up. 

If indeed, target functionality is destined for a decorator, we would have to define its components. A decorator definition consists of:

1. The decorator itself, as an an attribute.
1. A decorator handler conforming to the motive of the decoration.
1. Connecting decorators to their handlers.

#### The decorator

Decorators are [simple classes](https://php.net/manual/en/language.attributes.overview.php) for collecting instructions about the consuming class, to give its handler. Unlike in native PHP, Suphle decorators cascade to class descendants, compounding rather than overriding or getting lost altogether. Each decorator handler will receive all relevant attributes, from where it can decide to discard all, apply behavior to only the first or for each one.

#### Connecting decorator handlers

This is done using the `Suphle\Contracts\Hydration\DecoratorChain::allScopes` method. Intending customizers are advised to extend the `Suphle\Hydration\Structures\BaseDecorators` class already implementing that interface.

```php

use Suphle\Hydration\Structures\BaseDecorators;

class CustomDecoratorCollectors extends BaseDecorators {

    public function allScopes ():array {

        return array_merge(parent::allScopes(), [

            SomeDecorator::class => SomeDecoratorHandler::class
        ]);
    }
}
```

```php

use Suphle\Contracts\Hydration\DecoratorChain;

use Suphle\Hydration\Structures\BaseInterfaceCollection;

class CustomInterfaceCollection extends BaseInterfaceCollection {

    public function simpleBinds ():array {

        return array_merge(parent::simpleBinds(), [

            DecoratorChain::class => CustomDecoratorCollectors::class
        ]);
    }
}
```

#### Decorator handlers

This is where the decorator logic is defined. There are two broad categories of things we'll want to do with our decorators. These categories determine what type the decorator handler will implement. A decorator can either want to inspect arguments passed to a class or method, or it can act as a modifier of hydrated instances. Argument-based handlers are required to implement `Suphle\Contracts\Hydration\ScopeHandlers\ModifiesArguments`, while those working with instances should implement `Suphle\Contracts\Hydration\ScopeHandlers\ModifyInjected`.

Decorator handlers must exercise caution if they have the need to use the container, since doing so can lead to the same action that warranted decoration; and although object exists, the container is waiting for its decorators to approve it for release. This confusion will result in a memory leak, inevitably crashing execution.

For instance, when using the `Container::getMethodParameters` method within a handler, its 3rd argument should be used as a circuit-breaker to ward off argument-based decoration for the given types during the ensuing hydration sequence.

```php

// within a handler
$concreteName = $concrete::class;

$parameters = $this->container->getMethodParameters(
                    
    $methodName, $concreteName,

    [$concreteName]
);
```

##### Decorating arguments

In practise, you're more likely to extend `Suphle\Services\DecoratorHandlers\BaseArgumentModifier` rather than implementing the underlying interface. It currently doesn't provide much functionality except preventing you from implementing boilerplate.

```php
interface ModifiesArguments {

    /**
     * @param {arguments} mixed[]. Method argument list
    */
    public function transformConstructor (object $dummyInstance, array $arguments):array;

    /**
     * @param {arguments} mixed[]. Method argument list
    */
    public function transformMethods (object $concreteInstance, array $arguments, string $methodName):array;

    public function setAttributesList (array $attributes):void;
}
```

`transformConstructor` is a construct that enables us receive a random object of the class before instantiation, without triggering its constructor, thus making it favorable for transforming those arguments before their injection into the hydrated instance. Implementations are contractually required to return a list of arguments for injection into the constructor.

`transformMethods` behaves similar to `transformConstructor` but for every other method. In this case, the decoration is applied to the class itself, while the handler is responsible for determining the method to run logic on.

##### Decorating instances

Instance handlers can further be distilled into two kinds:

- Those that modify decorated instance without calling it
- Those that call decorated instance

Handlers that don't mutate given instance can simply implement `ModifyInjected`.

```php

interface ModifyInjected {

    /**
     * @return object to the caller
    */
    public function examineInstance (object $concrete, string $caller):object;
}
```

On the other hand, handlers mutating given instance are provided with a rich base class, `Suphle\Services\DecoratorHandlers\BaseInjectionModifier`. *Mutation* in this sense, refers to wrapping said object in a proxy that runs before the method's contents. This is sometimes known as AOP.

`BaseInjectionModifier::getMethodHooks()` is used to instruct this base on what methods to mutate.

```php

public function getMethodHooks ():array {

    return [

        "updateResource" => [$this, "wrapUpdateResource"]
    ];
}
```

It's expected to return a key-value pair of object method-to-handler callable. Combined with `ModifyInjected::examineInstance`, we'll then arrive at the following handler:

```php

class FancyHandler extends BaseInjectionModifier {

    public function examineInstance (object $concrete, string $caller):object {

        return $this->getProxy($concrete);
    }

    public function getMethodHooks ():array {

        return [

            "methodOnConcrete" => $this->wrapMethodOnConcrete(...)
        ];
    }
}
```

In `FancyHandler::examineInstance` above, the decorated object itself is passed to the helper method `getProxy`, which we're delegating proxying to, as dictated by `getMethodHooks`.

However, this can get unwieldy considering a class method can balloon into a large number, not to mention maintaining a hard-coded list of methods. For this purpose, we can use the `BaseInjectionModifier::allMethodAction` method to provide a callable applicable to all methods on the received object.

```php

public function examineInstance (object $concrete, string $caller):object {

    return $this->allMethodAction($concrete, $this->examineAllMethods(...));
}
```

Each of the callbacks given through `getMethodHooks`, `allMethodAction`, have the following signature:

```php

use ProxyManager\Proxy\AccessInterceptorInterface;

/**
 * @param {concrete} You're at liberty to type it to something more specific
 * @return type as underlying method necessitates
*/
public function wrapMethodOnConcrete (
        AccessInterceptorInterface $proxy, object $concrete,

        string $methodName, array $argumentList
    ) {

    try {
        // perform preliminary activity before or after

        return $this->triggerOrigin($concrete, $methodName, $argumentList);
    }
    catch (Throwable $exception) {

        //
    }
}
```

When practicing AOP, the proxy wrapper becomes responsible for either calling or terminating calls to target object. In the above example, we use the helper method `BaseInjectionModifier::triggerOrigin` to invoke the target. We receive the proxy itself as first argument, but it's merely for auditing purposes. On **no account whatsoever** should it be invoked from the handler; otherwise, it will result in an infinite loop!

###### Multiple injection-based decorators

Combining a cocktail of injection-based decorators with handlers invoking the same class may lead to both cognitive and execution mishaps. The same way they're stacked on the object, their respective handlers will receive instances wrapped by the preceding handler. When this is not the intended effect, ambiguity should be removed by converging the cross-cutting functionality at a unified handler, and composing its implementation details with the various collaborators required.

## Augmenting with 3rd-party containers

Suphle recognizes that just as it has its own semantics for hydrating objects, Containers written for other libraries or frameworks may require a level of autonomy over the manner in which objects are retrieved from it. Projects where this is applicable would want to notify `Suphle\Hydration\Container` about supplementary containers, using the `Suphle\Contracts\Config\ContainerConfig::getExternalHydrators()` config method. Container config defaults to `Suphle\Config\ContainerConfig`. 

```php
use Suphle\Config\ContainerConfig as BaseContainerConfig;

class ContainerConfig extends BaseContainerConfig {

    /**
     * {@inheritdoc}
    */
    public function getExternalHydrators ():array {

        return [$containerInstance];
    }
}
```

When this method returns a non-empty list of containers, and a hydration call to `Suphle\Hydration\Container` is unable to find a provision for this call, we will cycle through each given container in search of one capable of returning a valid object for the call. Foreign containers are required to implement the `Suphle\Contracts\Hydration\ExternalPackageManager` interface:

```php
interface ExternalPackageManager {

    public function canProvide (string $fullName):bool;

    /**
     * @return Instance of requested argument
    */
    public function manageService (string $fullName);
}
```

### Reducing 3rd-party scope

We use `ExternalPackageManager::canProvide` to avoid throwing foreign containers into a state of confusion by asking them to hydrate objects for classes they shouldn't be responsible for.

### Returning 3rd-party hydrations

Suphle expects to retrieve an instance of the delegated call from the `ExternalPackageManager::manageService` method. As with all hydrations, returned instance must conform to fully-qualified class requested.

## Testing the container

This section is intended for Suphle contributors and end-users looking to debug their provisions and bindings. It provides a programmatic, assertable interface instead of your possible IDE debugger which may be difficult to make sense of in the recursive settings that object hydration entails.

### Direct debugging

Much as Suphle frowns upon `var_dump`ing things, we can't shy away from it in contexts such as while debugging a faulty container before long running workers come alive. This is the reason Suphle provides the `Container::inProcessFileLogger` method. It takes an array of variables, but rather than writing them to `STDOUT`, they're written to a file returned by `Suphle\Contracts\Config\ContainerConfig::containerLogFile()`.

### Inspecting container activity

All the test-types contain a property, `monitorContainer`, that when set to `true`, activates inspection on all containers available within that test-type. Subsequently, assertions can be made against the observer as follows:

```php

protected $monitorContainer = true;

public function test_expected_container_behavior () {

    // given

    // when // either bind here or in the appropriate initialization method

    $this->assertTrue($this->containerTelescope->missedArgumentFor(
            
        ClassA::class, "requestDetails"
    ));

    // then
}
```

When using `ModuleLevelTest`, all containers receive the same telescope. If you wish to monitor activities on a select number of containers, you should manually set a telescope on the target container:

```php

use Suphle\Hydration\{Container, Structures\ContainerTelescope};

use Suphle\Testing\TestTypes\ModuleLevelTest;

class DebugContainerTest extends ModuleLevelTest {
        
    public function getModules ():array {

        $moduleOneContainer = new Container;

        $this->containerTelescope = new ContainerTelescope;

        $moduleOneContainer->setTelescope($this->containerTelescope);

        return [
        
            new ModuleOneDescriptor($moduleOneContainer),

            new ModuleTwoDescriptor(new Container)
        ];
    }
}
```

#### Telescope methods

The telescope contains methods that hook into observable functionality on the container. These are meta-test methods i.e. just as test code is separate from production code, telescope observations are for debugging and shouldn't be pushed along with test code, except you're contributing to the container itself. When this is the case, our objective is to make the container's labyrinthine operations as transparent as possible.

##### Selective monitoring

Regardless of environment, before a container gets the opportunity to record relevant details, it's bound to hydrate other objects irrelevant to examined event. We need to use the `setNoiseFilter` method to approve when recording is appropriate.

```php

public function test_expected_container_behavior () {

    // given

    // when // currently unexpected outcome

    $consumerList = $this->containerTelescope->setNoiseFilter(function ($telescope) {

        return $this->containerTelescope->missedArgumentFor(
            
            ClassA::class, "requestDetails"
        );
    })
    ->getConsumersFor(ClassB::class);

    $this->assertContains(ClassC::class, $consumerList);

    // then
}
```

##### Read-based observations

This is a suite of methods for gathering details regarding sources an object or its arguments were derived from.

To confirm arguments for an object used a given or expected provision, we use the `readArgumentFor` method.

```php

$bCounter = new BCounter;

$container->whenType($this->aRequires)->needsAny([ // given

    BCounter::class => $bCounter
])
->getClass($this->aRequires); // when

$this->assertTrue($this->containerTelescope->readArgumentFor(

    $this->aRequires, [

        "b1" => $bCounter
    ]
));
```

The complementary method for bound concretes/service locators is `readConcreteFor`. `readArgumentFor` uses an identical comparison for the provisions, although the instance may not always be accessible or convenient to use within the test. In such case, verifying the argument name alone will be satisafactory. For this, we use the `readArgumentWithName` method.

```php

$this->assertTrue($this->containerTelescope->readArgumentWithName(

    $this->aRequires, "b1"
));
```

To do a lookup for all objects that read provisions for an argument type, we use the `allReadArgument` method.

```php

$allConsumers = $this->containerTelescope->allReadArgument("container");
```

All concretes supplied from a prior provision is stored and can be read from the `getReadConcretes` method. Beware that object referencing lots of other objects with huge details can be overwhelming to output.

##### Write-based observations

We use this set of methods for confirming bindings were attached to intended entities.

The mutative methods `needs` and `needsArguments` correspond to `getWrittenConcretes` and `getWrittenArguments` methods on the telescope, respectively. Both methods will return all relevant provisions. To drill down to the specifics, we'll use the `wroteArgumentFor` method:

```php

$this->assertTrue($this->containerTelescope->wroteArgumentFor(

    $this->aRequires, "b1"
));
```

Note that argument name is used here rather than its type.

##### Observing refresh state

This observation equips us with methods required to verify what was refreshed, objects it dragged along with it, object parents and interfaces references or provisions that were wiped as a result. These objects are known as *consumers* to the telescope.

In order to access the full list of consumers or their possible parents affected by a call to `refreshClass`, we use the methods `getConsumerList` and `getConsumerParents` respectively. Refreshed entities are read from `getRefreshedEntities`. Of course, these lists can further be narrowed to their more specific details and is more likely to be your method of choice to understand what's going on.

Suppose we wish to confirm that `ClassB` dependency on `ClassA` will make it prone to be wiped when `ClassA` is departing the container, we'll use `getConsumersFor` method to pool all objects with a dependency on `ClassA`

```php

$consumerList = $this->containerTelescope->getConsumersFor(ClassA::class);

$this->assertContains(ClassB::class, $consumerList);
```

To scrutinize whether a target is included in the list of refreshed entities, the method `didRefreshEntity` can be helpful:

```php

$this->assertTrue($this->containerTelescope->didRefreshEntity($this->aRequires));
```

To verify a certain parent or interface part of a provision was removed as expected when its sub class got refreshed, we use `hasConsumerParent`like so:

```php

$this->assertTrue($this->containerTelescope->hasConsumerParent($dependent, $dependency
));
```

##### Monitor provision misses

This refers to recordings noted each time container attempts to pull arguments or concretes that are unavailable at the evaluated contexts. We may want to verify what these contexts are or debug what was missed.

To fetch all missed arguments or concretes in one go, we use `getMissingArguments` and `getMissingConcretes` respectively. Other lists we can fetch include `getMissingContexts` and `getStoredConcretes`.

The methods `allMissedArgument` and `allMissedConcrete` can be used to determine all callers who tried but were unable to read either arguments or concretes from the active provision.

For specifics, we use the methods `missedArgumentFor`, `storedConcreteFor` and `missedConcreteFor`.

```php

$this->assertTrue($this->containerTelescope->missedArgumentFor(

    $this->aRequires, "b1"
));
```

```php
$this->assertTrue($this->containerTelescope->storedConcreteFor(

    $this->aRequires, BCounter::class
));
```