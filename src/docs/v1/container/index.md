# CONTAINERS
Container pages are not the kind typically visited while perusing documentation. However, understanding what can be achieved with Suphple's container promises to pay huge dividends in the long run. But first of all, what is a container, and what does it "contain", anyway?

At the most basic level, they are object caches — you store object instances in them so you don't instantiate multiple versions of the same class and have them running all over the place. As applications grow more complex, we look onto them to fulfill needs beyond just object caching

Containers are the missing feature of every back end language. They are associated with making concretes out of interfaces but take care of other details such as hydrating and wiring arguments. One characteristic of a 
good back end framework is that its container is both versatile and powerful enough for the developer to never pull objects out of it directly

For the dynamism and OOP flexibility Suphple programs are expected to have, 
developers should not shy away from actively interacting with the 
container. The framework itself heavily relies on it to achieve the modular 
architecture.

With that said, we will look at what arsenal it offers its users

Container->spaceNeedsFrom: Doesn't make services implementing interfaces 
strictly required. Useful while maybe refactoring from one service 
implementation to another, on a scale spanning multiple controllers

Modules\CartModule\Controllers\CarController
Modules\CartModule\Contracts\ICarService // or CarService
Modules\CartModule\Services\CarServiceImpl //


#Handling circular dependencies
These are usually a code smell. Which is why most containers crumble when 
these are thrown at them. Logical flow ought to be composed in a 
hierarchical manner that expresses the lower level elements as entirely 
oblivious of their higher level counterparts. Service return values should 
be collated at a central point such as the controller and sent to 
evaluating service. Such situations are usually an indication that some 
part of those services should exist on their own. This enriches the 
application with a decoupled dependency chain, and by extension, 
testability

That said, "tell, don't ask" principle may appeal to some, and services can 
wind up in the constructor of their own dependencies. For instance, it may 
be undesirable to retrieve values from service x and plug into y (show 
example of chatty controller). In such cases, Suphple's container handles it using an otherwise, primitive implementation of class templates/generics/decorators

class A {

    function __construct(B $foo) {
        dump($foo);
        // $this->foo = $foo;
    }
}

class B {

    function __construct(A $foo) {
        dump($foo);
        // $this->foo = $foo;
    }
}

Pulling classes doesn't compare against types of provided entities. It simply won't work given the way objects are being stored for fast retrieval i.e. direct lookup, which is what type-hinting uses. In cases where this behavior is desirable, you will be better served by using the `sub` parameter

# auto-wiring and dependency injection
In practice, this refers to the process of type-hinting class constructors or specific methods of certain interfaces in order to reference predefined entities. These entities could be anything from interfaces to base types or primitives. The important takeaway is that developer doesn't get to use the `new` keyword or instantiate the constructor's arguments prior to their introduction into the required class

# contextual-binding