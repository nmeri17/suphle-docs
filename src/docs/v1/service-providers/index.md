# Service Providers

## What are they?
Service providers are classes bound lazily to the container, in a way that centralizes their replacement module-wide. While they may seem related to [contextual-binding](/docs/v1/container/#contextual-binding), they offer a very different kind of functionality. Maybe by comparison, we can clearly distinguish their differences. If contextual-binding is a way to supply a multitude of callers with applicable concretes, service provision can only be used to provide just one concrete. However, it centralizes this concrete to a point where:
- It can be easily replaced
- The concretes booting phase can be edited

Of course, both concepts can be combined as a powerful way to accomplish contextual provision i.e. diverse callers receiving differing states of the same concrete. The perfect use-case for service providers is when a group of callers require some kind of adapter. In an ideal world where library authors all fashion their packages after a common interface, with the aid of service providers, consumers can effortlessly swap out a payment or share link generation concrete by updating its initialization logic.

/// Note 1
If the concrete returned from the service provider refuses to match the interface by which it was provided, the container will not budge when asked to hydrate that interface.

/// Note 2
Concretes can't be provided i.e. the provider can't be labelled/denoted with the name of a concrete class

/// creating a new provider, registering the provider

What methods do they contain?

## Service Integration
Developers coming from laravel may expect to see more details concerning the integration of external libraries through this medium. However, Suphple differs in that such tweaks are achieved by means of configuration classes.

For instance, one who intends to do x might be better off...

Explain how here or link to those pages