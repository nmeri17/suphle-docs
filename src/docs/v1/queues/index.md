# Queues

## Introduction
Events are a direct precursor to queues. Think of them as deferred events. If events are a way of extracting unrelated code from visual flow and opening up code for injecting and extending, queues are a way of delegating the event bootstrap and invocation process.

While it may be tempting to defer events and functionality, beware of business requirements making it unrealistic to dispense value without awaiting completion of an orderly sequence of activities

The task classes have to conform to whatever adapter is active

Make it a point of duty to have the queueing server running after each deployment. This allows us push tasks to it
The runner wants to receive whatever module our desired adapter is bound