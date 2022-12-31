## Introduction
When someone is asked "what part of our application do we test?", a wide range of answers quickly come to mind. Do we concentrate our efforts on our controllers since it encompasses the user's interaction with our application? Do we even pay attention to our validation layer so as to secure our endpoints from nonsensical input? What about models, events, services?

An objective answer would approach that question by
1) the amount of value testing each layer offers
2) the layer that provides a broad surface area for examination

Controllers pass the first point in flying colours, but fail the second one woefully. Due to their nature of crowding data from a myriad of sources under the umbrella of one endpoint, it becomes near impossible to exhaustively test those sources independently.The validation layer sits low in the hierarchy of importance, since one can't boast of how foolproof their input interceptor is if the business logic working with the input functions incorrectly

Given enough time and manpower, no layer should be exempt from being tested; that includes model hydrators, middleware, error handlers, authorization, queued tasks, configuration. However, in the absence of that, we channel our limited resources on the most critical aspect of our software – the business layer. If we can't guarantee the integrity of this layer, nothing we are building matters to the stakeholders. That is why decisive steps are put in place in the controllers to drive the service-oriented gospel home

What would constitute a robust testing regimen is extensive examination of all the services come in contact with – specifically, the parts of our services that end up in controllers, the tasks they queue, listeners to raised events. A medium sized application will almost certainly contain enough code that testing this layer will keep the developers occupied before attaining satisfaction. When they eventually do, they can then ascend to the fringes of middleware, dtos and external calls (link to http)

## to test presentation format or not to test
What becomes of this mighty layer, then? Actually, It is still vital in the scheme of things. However, the controller is not the best place to situate such tests. Presentation ultimately belongs in the realm of markup for html based responses, and documentation for API based ones. Presentation shouldn't concern itself with whether the information served to it by the business layer is "correct" or not. Its sole responsibility is to layout that data it receives in a format agreed upon by the applicable consumption mechanism (html/json)
// can you give an example of testing the "data" value goes into div id x?

**
I will say unit tests are impossible to decouple from code. Integration tests for behavior shouldn't meddle with implementation details except where unwanted io is incurred. Then it has to be replaced with appropriate doubles. I almost always prefer mocks, to avoid an imaginary fiend removing the dependency and it's not apparent that a significant change has occurred

This sort of brittleness is inevitable, AFAIK
**
My own take for controllers:

1) do the http test for endpoints. It's unfortunate that there aren't more 
libraries available for generic http tests verifying basic status code

2) don't test controllers. That's the most common candidate of brittleness

3) test the underlying services used by the action methods

Testing response values for coordinators reusing services leads to duplicate tests
Api = requires validation fields, status codes, and response shape

Test = requires coupling to service methods for the sake of regression. 
This prevents status codes from verification
