# Motivation

Despite the multitude of frameworks already existing, and the few globally successful ones, Suphple was created for purposes discussed below.

## Goal

Programming language books teach its readers syntax and how to write code. Current frameworks implement common application features and structure them in ways that apply to a majority of use-cases. No current category of software caters to enabling its users maintain existing projects; only medium-to-advanced level articles assist in this regard. Creating functional software and subsequent maintainance boils down to tests. With this in mind, it may be helpful if the next generation of development tools geared more **towards enabling its users write code with the conscious aim of elegant extension or modification**. This translates to a number of things:

- Maintainers need to understand that adding new features goes beyond simply changing existing controller/service methods or sprinkling new endpoints. There should be more conscious strategies at play.
- Product owners need to understand how indispensable tests are.
- Developers ought to assume their successor doesn't know all the program's capabilities before they can confidently extend the project.

---
Nothwithstanding the fact that Suphple implements functionality for achieving these goals, [automated tests](/docs/v1/testing) are at the heart of it all. No matter how many design patterns are followed to the letter, dreadful outcomes are inevitable in their absence. It's a little curious how their mere existence is so crucial to a product's quality, yet the end user is blissfully unaware of them. For this reason, developers are known to avoid them. The average developer's priority is to churn out as much features as possible in the shortest amount of time. The next generation of frameworks should assist in this crusade by vindicating the quality of what is being built before and during its shipment to production.

In other words, Suphple's most important mission is for developers to create projects that don't break in production, because they are being properly maintained. Every other fancy terminology and core functionality is a means to that end. [Dependency decoupling](/docs/v1/container/#namespace-rewriting), [auto-wiring](/docs/v1/controllers/#model-hydration), [canary routes](/docs/v1/routing/#canaries), [flows](/docs/v1/flows); they are worth nothing if your program still responds in unexpected ways when it matters most.

If you are visiting this page first before going through the rest of the documentation, those parts don't simply describe what functionality is possible, but dissect what aspects of development require them.
