##MIDDLEWARE
Since routes are being composed down tries, route collections middlewares 
should contain references to what pattern method they are bound to.

We only need middlewares to transform response or request objects over a 
group of action handlers

They're bound to the collection, not the renderer

How do we pass arguments to middleware from their definition point? How do 
I register global middleware that runs on all requests?