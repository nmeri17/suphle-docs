# Events

## Introduction
A criminally overlooked part of back end engineering. Suphple would restrict all read/write database operations to be only executable within the context of a specific side-effect event handler. But for the sole purpose of commands whose producers are more optimized with synchronous responses, such imposition was left to the developer's discretion. A fine example being our module sending a create event for a related model within the boundaries of another module.

One line of defense against this obstacle advocates against the use of relational models in service oriented architectures. A less drastic opinion suggests making use of guids instead of auto incremented ids. Whatever design decision is made based on these considerations, events are expected to be an important part of it. Pay attention at seams for operations whose results are of no importance to the response.

## Listeners

Mention event cascading

Can take multiple space-delimited event names

Begins where we supply from our config the sub class of eventManager where listeners are bound

Listening to foreign events

Local events are decoupled from the concrete that emits them. This makes it safe to listen to an interface or super class
/// Example

Setting a handler that implements Repository will get wrapped for you and behave as if the service was injected directly and wrapped with that proxy
// example

