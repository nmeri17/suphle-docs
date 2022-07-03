# Events

## Introduction
Events are a criminally overlooked part of back end engineering. It is so crucial that Suphple would restrict all write database operations to be only executable within event handlers. But for the sole purpose of commands whose producers require the ID of sub entities, such imposition was left to the developer's discretion. A fine example being our module sending a create event for a related model within the boundaries of another module.

One line of defense against this obstacle advocates against the use of relational models in service oriented architectures. A less drastic opinion suggests making use of guids instead of auto incremented ids. Then again, in cases where commands that rely on data from sub-commands, the sub-command can be considered a query, and should probably receive the same treatment as other queries i.e. being imported into the consumer

Whatever design decision is made based on these considerations, events are expected to be an important part of it. This is because they are a strong symbol of high cohesion, enabling us escape the terrors of transactional scripts (link). You want to pay attention at seams for operations whose results are of no importance to the response.

## Listeners

Mention event cascading

Can take multiple space-delimited event names

Begins where we supply from our config the sub class of eventManager where listeners are bound

Listening to foreign events

Binding listeners to an emittor more than once will overwrite the previous bindings

Local events are decoupled from the concrete that emits them. This makes it safe to listen to an interface or super class
/// Example


## Event-based Concerns
The beauty of utilising events to exchange commands between modules is nearly tainted by the fact that they tend to limit the amount of information one can deduce by looking at an originating action. It's difficult to assess access and effect of the scrutinised action, thereby making reasoning about it an uphill task. Fortunately, interfaces (which every module happens to implement) have constants. This implies one can simply check for all usages of the constant, as a guiding light to locate subscribers if need be

This equally means that modules merely reacting to events from an emitting module don't have to import a concrete version of it. All it takes to react to it is to reference the interface in the reactor, and Suphle will handle the rest

// example of using a constant as event name

Any object that wishes to emit events requires its module to have at least one class extending from `EventManager`, even if it doesn't actually listen to any events. This is because the main `EventManager` is declared abstract, and as such, can't be instantiated

// after showing basic emission

There is a recommended safety trait, `EmitProxy`, that prevents emittors from falsely emitting events using the name of other classes
// show usage

However, using it will preclude you from binding listeners to an interface, if you have the need to do so

**
Event handlers receive emitted payload as-is–without meta information such as the emitting instance etc. For this reason, suphle doesn't interfere by enforcing payload type. The emitter must document what type its consumers are expected to adhere to