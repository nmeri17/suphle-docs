# Service Providers

## What are they?
Service providers are classes bound lazily to the Container, in a way that centralizes their replacement module-wide. While they may seem related to [contextual-binding](/docs/v1/container/#contextual-binding), they offer a very different kind of functionality. Maybe by comparison, we can clearly distinguish their differences. If contextual-binding is a way to supply a multitude of callers with applicable concretes, service provision can only be used to provide just one concrete. However, it centralizes this concrete to a point where:
- It can be easily replaced
- The concretes booting phase can be edited

Both can't be combined since consumers are not meant to be aware or coupled to the underlying concrete. In addition, if this were possible, it would permit diverse callers to receive differing states of the same concrete, which would in turn lead to programs difficult to reason about.

The perfect use-case for service providers is when a group of callers require some kind of adapter. In an ideal world where library authors all fashion their packages after a common interface, with the aid of service providers, consumers can effortlessly swap out a payment or share link generation concrete by updating its initialization logic.

/// Note 1
If the concrete returned from the service provider refuses to match the interface by which it was provided, the container will not budge when asked to hydrate that interface.

/// creating a new provider, registering the provider

What methods do they contain?

- `bindArguments`
We use this method to obscure away instantiation details from an interface's consumer -- which they shouldn't be bound to. Any arguments required by the given constructor are described here.

Of course, when providing interfaces, there are no constructor methods to fill. The key/value expected to populate this array is a blank cheque matching whatever parameters are required to instantiate the concrete being supplied
///
Show example

## Service Integration
Developers coming from laravel may expect to see more details concerning the integration of external libraries through this medium. However, Suphle differs in that such tweaks are achieved by means of configuration classes.

For instance, one who intends to do x might be better off...

Explain how here or link to those pages