# Modules

## Preamble: The modular philosophy

One of the great dividends of building opinionated structures is that it solves the architectural problem for its eventual user. With that out of the way, they are left to think in "services" -- isolated, exportable micro-units of logic. Think of it as a [design system](https://en.wikipedia.org/wiki/Design_system) for back-ends. Every mature design system has a user-contributed gallery of components conforming to its principles. *That* is one of the eventual dreams with Suphple; that projects can be commenced and executed with the aid of extended, freely available domain-specific business-oriented micro-dependencies, following an identical coding trend.

---

## The what and why
In lower-level terms, modules come in handy when we intend to compose systems with detachable parts. That characteristic means they can be developed and tested independently, integrated without risk of crumbling the existing project.

To be clear, modules offer no protection against breaking features after updating unrelated parts of the codebase. To solve that problem, you'd like to look at the testing chapter for integrating [new changes](/docs/v1/testing/confidently-integrating-upgrades).

Note that modules shouldn't be shoe-horned into every project simply because they exist or are considered a cool fad. They are better suited for rapid development environments, AGILE settings where features will be likely short-lived, activated and deactivated. You want each module to contain services performing similar behaviour. It doesn't matter if they work with more than one model. A full-fledged module can be extracted from the rest of the application, and still retain enough conceptual meaning to be plugged somewhere else

It's usually safer for concepts/domains to start out as separate modules dependent on each other, and only get merged into one when the interactions between them becomes more than trivial. If module A's controller is dominated by calls to different services borrowed from module B that it depends on, it could mean they belong together.

Modules comprise of whatever arrangement of classes we intend on introducing to our application as a whole. In order to achieve this, we will need to define a sub-class of `Suphple\App\ModuleDescriptor` which will be included in our application's list of modules.

## App Entry Point
This is a class found in your project root folder, under the path "public/index.php". The actual class name doesn't matter. The only important requirements are that it extends `Suphple\App\ModuleHandlerIdentifier` and exposes a list of `Suphple\App\ModuleDescriptor`s via its `getModules` method. Assuming we're publishing multiple modules, that would look like this:

```php

	use Suphple\App\{Container, ModuleHandlerIdentifier};

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

Conversely, we admit modular dependecies using this channel. `dependencies` is a key-value pair dictating what dependency type is being imported, and its complimentary concrete:

`[exportsImplements => moduleDescriptor]`

/// Show example of putting module in a connected state before linking

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

Sometimes, we may want to allow configuration values be set by the module's consumer. In such case, the value should be assigned to instance level properties. Inside the relevant service provider/config, the module will be type hinted, and the value lifted

/// Example

Each module should have its own vendor folder i.e. None at the root