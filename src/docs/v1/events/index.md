##EVENTS
A criminally overlooked part of back end engineering. Suphple would 
restrict 
all read/write database operations to be only executable within the context 
of a specific side-effect event handler. But for the sole purpose of 
commands whose producers are more optimized with synchronous responses, 
such imposition was left to the developer's discretion. A fine example 
being our module sending a create event for a related model within the 
boundaries of another module

One line of defense against this obstacle advocates against the use of 
relational models in service oriented architectures. A less drastic opinion 
suggests making use of guids instead of auto incremented ids. Whatever 
design decision is made based on these considerations, events are expected 
to be an important part of it. Pay attention at seams for operations whose 
results are of no importance to the response

Mention event cascading