## Introduction
Modules are by nature independent and self-sufficient. But if we hope to build reusable modules, adjustments to that law are inevitable. There are two categories of possible augmentation we may want to make to our modules:
A. Implementation detail
B. Variables that aren't within the module's power to provide, for example, limiting what routes are exposed by its route collection, rendered views, `Suphle\Contracts\Config\ModuleFiles`

As has been earlier demonstrated, events and direct invocation are the recommended methods for inter-module interaction. You usually want to *extend* modules when the domain-specific (or child) module relies on a more generic (or parent) one for either a bulk of its functionality or orchestrating its implementation details. But this orchestration can only be triggered by running the child module since the parent has no way of knowing all possible domain-level details. But once one module is layered above the other, we'll be faced with a new dilemma of connecting the module afresh to the list of published modules. Continuing on this path will ultimately land us at a complicated place of complex module parent chains, looking for things along trees. Thankfully, there is a shorter way that doesn't just solve this without incurring the issues mentioned above, but equally tackles category B, above--Packages.

They achieve this by enumerating a list of files to be duplicated into target module's territory. Packages don't supercede modules, but are more like cousins. They don't have a definite structure and should only be the size of the functionality exposed. It is safe to define them as a form of extending modules; especially, as it is unlikely you'll use the same generic module more than once in the same application

## Defining a package
The only requirement that qualifies a package is by providing a list of files. It's not necessary to specify files we don't intend to deposit within the consuming module. We do this using a `PackageEntry`

## Connecting a package

```bash
suphle deposit-package descriptor entryInterface
```