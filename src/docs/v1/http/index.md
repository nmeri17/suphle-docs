## Introduction

##projecting against foreign processes
Any operation dependent with external systems should be wrapped in a try catch. Its location means its response is beyond our control and subject to failure. The objective is for service methods to never contain code reaching out to external platforms; be it emails, file generation, API calls – whatever involves a process whose code we don't have should be abstracted to a common layer where:

1) it can be stubbed out

2) we can gracefully recover from its failure

We want to separate our business logic from the point where the mail is eventually fired off into oblivion. Because we have no programmatic way of knowing whether mail delivery was successful, the most we can do is hope for the best when running the mailer's send function. If that function is our last hope, it had best run in an environment where failures trigger recursion

The nature of task queues make them suitable for such architectural requirement

* working with API calls
This section refers to synchronous http calls whose response is required for computing our own request. We simply can't ship the call to a queue and forget about it.
Vending apis commonly respond with codes indicating the status of the initiated action. You want your code paths to account for

1) situations where the response you receive is outside what was promised by the authors of that api
2) error/unsuccessful status codes. If the API doesn't make explicit provision for these, the developers are suspect. Guard yourself with a custom else block

Bearing this in mind, we'll be looking at the base http request class recommended for making http calls in suphle. It is a cross between intercepts external and service error catcher decorator. base http request doesn't terminate the request. However, on translationFailure, it forwards the exception to alert adapter and returns an optionalDto informing the caller that operation was unsuccessful. This is sufficient if no custom exception was thrown inside translate, otherwise, you'll have to check for that before bubbling to alert adapter
//example

As can be seen above, base http request makes use of psr18 compliant http client, of which suphle injects the guzzle library. This means that while it may not be visible on the interface, the client can do impressive feats such as async and concurrent requests that guzzle is known for

For making HTTP requests, Suphle provides the `BaseHttpRequest` class. It doesn't compete with libraries like Guzzle or HttPlug for functionality regarding outgoing requests. It also isn't a platform for writing SDKs. It's primary objective is to sequester:

1. The application/domain from the clumsiness of outgoing links, payloads etc
1. The request itself from data relevant to the application/consumer. Aside distilling data, this gives the additional advantage of testing these parts of our program using whatever data we please, simulating errors, etc.

We may have other needs that intersect with those listed earlier under [ModellessPayload](controllers/services/section)s. For this reason, they both implement the same interfaces but with slightly diverging implementations