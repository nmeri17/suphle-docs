# Modules

## Preamble: The modular philosophy

One of the great dividends of building upon opinionated structures is that it decides on a solution to the architectural problem for its eventual user. With that out of the way, user is left to figure out higher-level problems. For web applications, those higher-level problems are usually called services or domain logic.

At an even higher level, those services, bespoke on a now lower-level, become applicable units of logic in that domain as a whole. *That* is one of the eventual dreams with Suphle -- that projects can be commenced and executed with the aid of domain-specific dependencies following a predictable, proven trend.

This doesn't mean every application should be structured in the same manner. The idea is that the number of ways to poorly structure an application far outnumber proven ways to build applications that are easier to maintain. It takes a level of thought that can be expensive for some. For these set of developers, it helps to condense proven designs into reusable frameworks, in order to take that responsibility away from them. In our case, modules should not be shoe-horned into every project simply because they exist or are considered a cool fad. They are better suited for rapid development environments, AGILE settings where features will likely be short-lived, activated and deactivated.

At the technical level, modules come in handy when we intend to compose systems with detachable parts. That characteristic means they can be developed and tested independently, integrated without risk of crumbling the existing project. They will benefit from having their own `composer.json`/vendor folder, `.env` etc. To be clear, modules don't necessarily offer protection against breaking existing features after updating unrelated parts of the codebase. To solve that problem, you'd like to look at the testing chapter for integrating [new changes](/docs/v1/testing/confidently-integrating-upgrades).

You want each module to contain services performing similar behaviour (at the risk of them working with more than one model). A full-fledged module can be extracted from the rest of the application, and still retain enough conceptual meaning to be plugged in another application or standalone. It's usually safer for concepts/domains to start out as separate modules dependent on each other, and only get merged into one when the interactions between them becomes more than trivial. If module A's controller is dominated by calls to different services borrowed from module B that it depends on, it could mean they belong together.

// show that picture here and add credit

Modules comprise of whatever arrangement of classes we intend on introducing to our application as a whole. In order to achieve this, we will need to define a sub-class of `Suphle\Modules\ModuleDescriptor` which will be included in our application's list of modules.

## App Entry Point
project root folder, under the path "public/index.php

it extends `Suphle\Modules\ModuleHandlerIdentifier` and exposes a list of `Suphle\Modules\ModuleDescriptor`s via its `getModules` method. Assuming we're publishing multiple modules, that would look like this:

```php

	use Suphle\Modules\{Container, ModuleHandlerIdentifier};

	use ModuleLand\{ModuleOne\Descriptor as Descriptor1, ModuleTwo\Descriptor as Descriptor2};

	class Index extends ModuleHandlerIdentifier {
		
		function getModules():array {

			return [
				new Descriptor1(new Container),

				new Descriptor2(new Container)
			];
		}
	}

	echo (new Index)->orchestrate();
```
The above is enough for situations where there is no form of communication between `Descriptor1` and `Descriptor2`. However, before we examine the finer details of such interaction, let's study the capabilities of a module descriptor.

## Module Descriptors
This class allows us expose desired functionality to its module's consumers. In addition, it serves as both a platform for declaring module-wide dependencies, as well as the port through which other modules are inserted into ours. Below, we will examine the methods it contains.

### Decoupling Siblings
- `exportsImplements():string`

Decoupling and detachment go hand in hand i.e. if modules are expected to be detached at will, consumers shouldn't rely on specific implementations. This method informs sibling consumers what contract this module is expected to fulfill. Such contract can be considered to be this module's API.

- `exports():object`

Here, we return our concrete implementation of the interface presented through the `exportsImplements`.

/// Example showing use of `Interactions` namespace and functionality exposure
/// file ==> ModuleHandlerIdentifier. Same below

### Consuming sibling modules
- `setDependsOn(array $dependencies)`

Modules that consume data from other modules use an explicit syntax of a key-value pair dictating what dependency type is being imported and its complimentary concrete. This enables clarity in definition of dependencies to be fulfilled before each module can be whole. Think of it as an argument list or `composer require`s list. Having this kind of boundary foils indiscriminate access to modules not explicitly depended on

// show the sendExpatriates

However, that last point comes at a price: composition prohibits cyclical module referencing. In such cases, we break their hard-dependency by employing an extra module to mediate. Assume the following scenario:

- `ModuleA::produceData1` creates data 1 for ModuleB to consume, using `ModuleB::consumeData1`
- `ModuleB::produceData2` creates data 2 for ModuleA to consume, using `ModuleA::consumeData2`

The above dependency graph won't work, but we can refactor a bit to demarcate who needs what into a central location,

- ModuleA and ModuleB escalate production of data 1 and 2 to `ModuleC::produceData1` and `ModuleC::produceData2`. Both modules are now free to depend on it for production of their respective data. Even though they commonly interact with data 1 and 2, they neither have a dependency on each other nor does ModuleC know about their existence

### Internal Dependency Declaration
- `entityBindings`

This is where [bindings](/docs/v1/container/#contextual-binding) should predominantly reside. It runs immediately after module has confirmed it can handle incoming request and is closely related to [service provisioning](/docs/v1/service-provision).

Both options are different sides of the same coin, with the subtle difference being that service provision hydrates dependencies lazily. It is assumed that classes with more comprehensive initialization phases ought to move to [dedicated classes](/docs/v1/service-provision/#creating-a-new-provider), rather than clutter this method.

Dependencies are auto-wired into it, which would allow us to do something like
/// set object to desired state and bind to container

Binding objects in this manner prevents them from appearing in the container of other modules

### Module Configuration
- `getConfigs`

This is the method through which internal configuration is assigned (or replaced) to its implementation.

/// Example of replacing Auth config

Sometimes, we may want to allow configuration values be set by the module's consumer. In such case, the value should be assigned to instance level properties.

/// Example 

Discuss how module shells import other descriptors puts them in a hibernated state until they're ready to run

Testing a module with absent dependencies is as straightforward as stubbing out the contract it's expected to fulfill

## New user-land modules
The structure in template folder is expected to mirror destination structure

## How do you add additional routes to a module?
You don't, as that would require controllers, services and the likes. You are better off defining those routes in your own module, only utilizing functionality on the imported module. See chapter on [packages](/docs/v1/packages)