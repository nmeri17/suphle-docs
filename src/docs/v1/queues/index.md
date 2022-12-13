## Introduction

[Events](/docs/v1/events) are a direct precursor to queues. Think of them as the deferred equivalent of events. If events are a way of opening up code for injecting and extending, queues are a way of procrastinating event distribution and invocation process. This advantage over events is evened out by the fact that listeners can't subscribe to queue pushes. Either events or queues should be used whenever the emittor/initiator doesn't need the result of a method call.

While it may be tempting to defer either all possible opportunities to do so, or wrap queue pushes in events, remember that queue tasks are executed asynchronously. This will prove problematic for business requirements where it's unrealistic to dispense value without awaiting completion of an orderly sequence of activities.

### Projecting against foreign processes

Any operation dependent with external systems should be wrapped in a try-catch. Its response's source makes it beyond our control and subject to failure. The objective is for service classes to, themselves, never contain code reaching out to external platforms; be it [emails](/docs/v1/io#mailing), [file generation](/docs/v1/image-upload), [API calls](/docs/v1/http) – whatever involves a process whose code we don't have should be abstracted to a common layer where:

1. It can be stubbed out
1. We can gracefully recover from its failure

We want to separate our business logic from the point where the mail is eventually fired off into oblivion. Because we have no programmatic way of knowing whether mail delivery was successful, the most we can do is hope for the best when running the mailer's send method. If that method is our last hope, it had best run in an environment where failures trigger recursion. The nature of task queues make them suitable for such architectural requirement.

## Writing task classes

Task classes contain the logic we intend to execute later. They're required to implement the `Suphle\Contracts\Queues\Task` interface. The specifics of how task classes can receive arguments is up to the underlying adapter used. The default pattern is to expect serializable parameters from the class's constructor. A typical task class will look as follows:

```php

use Suphle\Contracts\Queues\Task;

class DeferSomething implements Task {

	public function __construct (

		private ProcessingDependency $processor,

		private Predicate $toProcess
	) {}

	public function handle ():void {

		// do something to $this->toProcess using $this->processor
	}
}
```

The constructor runs synchronously, but the `handle` method will be offloaded to another PHP worker. When any of the parameters are not serializable, you can consider passing an identifier with which it can be rehydrated when the task eventually runs.

## Pushing tasks to the queue

Before a task can run, it must be pushed to the task queue. We achieve this using the `Suphle\Queues\AdapterManager` class, like so:

```php

use Suphle\Queues\AdapterManager;

class SomeService {

	public function __construct (

		private AdapterManager $queueManager,

		private ProcessingDependency $processor
	) {}

	public function someAction ():void {

		// produce $predicate

		$this->queueManager->addTask(DeferSomething::class, [

			"processor" => $this->processor,

			"toProcess" => $predicate
		]);
	}
}
```

Using the `addTask` method is only required when the arguments are produced at the site where task is being pushed to the queue. In the case of `DeferSomething`, there's nothing spectacular about the instance of `ProcessingDependency` given. Thus, we can afford to omit it. Passing arguments to `addTask` is only necessary for custom instances or scalar quantities. Every other strongly-typed parameter will be auto-wired for you.

```php

class SomeService {

	public function __construct (

		private AdapterManager $queueManager
	) {}

	public function someAction ():void {

		// produce $predicate

		$this->queueManager->addTask(DeferSomething::class, [

			"toProcess" => $predicate
		]);
	}
}
```

## Activating the task queue

Without activation, we'd have nowhere to push our tasks to. The manner in which this queue is activated relies on either how our application is served or what underlying transport mechanism we intend to power the queue with.

### RoadRunner tasks

When the application is published using the RoadRunner binary, the same modules [bundled](/docs/v1/modules#Connecting-standalone-modules) for routing will be passed to passed to each dedicated task worker. The number of worker is controlled from the RoadRunner congig `*-rr.yaml` file.

```yaml
jobs:
#   # Number of threads which will try to obtain the job from the priority queue
#   #
#   # Default: number of the logical CPU cores
  num_pollers: 32

  # Size of the internal priority queue
  #
  # Default: 1_000_000
  pipeline_size: 100000

  timeout: 60

  # worker pool configuration
  pool:
    command: ""
    max_jobs: 0
    num_workers: 10
    allocate_timeout: 60s
    destroy_timeout: 60s
```

Their Jobs plugin supports amqp, beanstalk, sqs, and boltdb. If your transport mechanism of choice is outside this list, consider looking. For in-depth details on how to configure the plugin, do visit [its section on their documentation](https://roadrunner.dev/docs/plugins-jobs/2.x/en#common-configuration).

// manual flow-starter
Make it a point of duty to have the queueing server running after each deployment. This allows us push tasks to it

The runner wants to receive whatever module our desired adapter is bound

configuration

## Testing queues

catchQueuedTasks in the setup