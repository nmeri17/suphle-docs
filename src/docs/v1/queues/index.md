## Introduction

Events are a direct precursor to queues. Think of them as the deferred equivalent of events. If events are a way of extracting unrelated code from visual flow and opening up code for injecting and extending, queues are a way of delegating the event bootstrap and invocation process. Either of them should be used whenever the emittor/initiator doesn't need the result of a method call.

While it may be tempting to defer all events and functionality, beware of business requirements making it unrealistic to dispense value without awaiting completion of an orderly sequence of activities

##projecting against foreign processes
Any operation dependent with external systems should be wrapped in a try catch. Its location means its response is beyond our control and subject to failure. The objective is for service methods to never contain code reaching out to external platforms; be it emails, file generation, API calls – whatever involves a process whose code we don't have should be abstracted to a common layer where:

1. It can be stubbed out

1. We can gracefully recover from its failure

We want to separate our business logic from the point where the mail is eventually fired off into oblivion. Because we have no programmatic way of knowing whether mail delivery was successful, the most we can do is hope for the best when running the mailer's send function. If that function is our last hope, it had best run in an environment where failures trigger recursion

The nature of task queues make them suitable for such architectural requirement

The task classes have to conform to whatever adapter is active ((still true?))

// manual flow-starter
Make it a point of duty to have the queueing server running after each deployment. This allows us push tasks to it

The runner wants to receive whatever module our desired adapter is bound

## Testing queues

catchQueuedTasks in the setup