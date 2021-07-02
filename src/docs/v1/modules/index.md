# Modules

## Preamble: The modular philosophy
One of the great dividends of building opinionated structures is that it solves the architectural problem for its eventual user. With that out of the way, they are left to think in "services" -- isolated, exportable micro-units of logic. Think of it as a [design system](https://en.wikipedia.org/wiki/Design_system) for back-ends. Every mature design system has a user-contributed gallery of components conforming to its principles. *That* is one of the eventual dreams with Suphple; that projects can be commenced and executed with the aid of extended, freely available domain-specific business-oriented micro-dependencies, following an identical coding trend.

## When to create a new module
While there is a large number of factors regarding when part of an application should gain autonomy, a few are logical; but there's no standard cast in stone — only a few general rules of thumb. One obvious indicator is them having the same route prefix. As for unrelated concepts, it is usually safer for them to start out as separate modules dependent on each other, and only be merged into one when the interactions between them becomes more than trivial. If module A's controller is dominated by calls to different services borrowed from module B that it depends on, it could mean they belong together.

## External Configuration

Configuration passed into Modules should be assigned to instance level properties. Inside the relevant service provider/config, the module will be type hinted, and the value lifted

Each module should have its own vendor folder i.e. None at the root

Talk about app entry point (#entry-point)

Look at methods on the module file

## Modular binding
- `entityBindings`

This is where [bindings](/docs/v1/container/#contextual-binding) should predominantly reside. It runs immediately after module has confirmed it can handle incoming request and is closely related to [service provisioning](/docs/v1/service-provision).

Both are different sides of the same coin, with the subtle difference being that service provision hydrates objects lazily. It is assumed that classes with more comprehensive instantiation/initialization phases ought to move to [dedicated classes](/docs/v1/service-provision/#creating-a-new-provider), rather than clutter this method.

Dependencies are auto-wired into it, which would allow us to do something like