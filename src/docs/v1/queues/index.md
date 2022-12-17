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

There's nothing spectacular about the instance of `ProcessingDependency` given to `DeferSomething`. Thus, we can afford to omit it. Passing arguments to `addTask` is only necessary when the arguments are produced or customized at the site where task is being pushed to the queue, or scalar quantities. Every other strongly-typed parameter will be auto-wired for you.

```php

class SomeService {

	public function __construct (

		private readonly AdapterManager $queueManager
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

When the application is published [using the RoadRunner binary](/docs/v1/application-server), the same modules [bundled for routing](/docs/v1/modules#Connecting-standalone-modules) will be passed to passed to each dedicated task worker. The number of workers is controlled from the RoadRunner congig `*-rr.yaml` file.

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

For in-depth details on how to configure the plugin, do visit [its section on their documentation](https://roadrunner.dev/docs/plugins-jobs/2.x/en#common-configuration). Their Jobs plugin supports amqp, beanstalk, sqs, and boltdb. If your transport mechanism of choice is outside this list, consider implementing the `Suphle\Contracts\Queues\Adapter` interface for that mechanism, and connecting it as a [interface loader](/docs/v1/container#Interface-loaders). This connection should be done on the titular module, as that is what will be used by the worker accessor to hydrate adapters.

```php

use Suphle\Queues\AdapterLoader;

class CustomQueueLoader extends AdapterLoader {

		public function concreteName ():string {

			return PipelineQueueAdapter::class;
		}
}
```

### Externally-managed activation

Outside the roadrunner setting i.e. when application is served traditionally using index.php, you can either use a daemon such as supervisord or similar during each deployment cycle of the application to revive the activation script. The preset script for this is one titled "manual-flow-starter.php" residing on the project root of all Suphle installations. This script will be responsible for putting the right objects in place for [Flows](/docs/v1/flows) as well, as long the underlying servers those objects are connected to are alive at the locations given in their connection strings.

## Configuring queue adapters

Active adapter in use will typically determine connection parameters. The default, `Suphle\Adapters\Queues\SpiralQueue`, is connected to a bolt-db pipeline mechanism, and expects to successfully connect to the url `tcp://127.0.0.1:6001`. As with other properties for the `SpiralQueue` adapter, this value can be modified by updating relevant entries in the `*-rr.yaml` config. Connection string, for instance, is represented by the `RR_RPC` entry.

## Testing queues

Queue tests are only compatible with module-level tests. Suphle provides the `Suphle\Testing\Condiments\QueueInterceptor` trait for verifying status of an in-memory queue, as well as manually triggering execution of tasks pushed onto the queue and observing its side-effects afterwards.

### Initializing testing queue

Within the testing environment, you typically won't expect to have tasks pushed to the production level queue. For this reason, your queue adapter is replaced with a dummy that doesn't nothing. In order to make queue-based observations, this dummy must be replaced with an adapter capable of such assignment. Tests with no other trait or no trait that overwrites the `setUp` method don't have to worry about this, since `QueueInterceptor::setUp` does that for you already. Otherwise, you have to call the `QueueInterceptor::catchQueuedTasks` method manually before proceeding to run operations that push something onto a queue stack.

```php

class SomeQueueTest extends ModuleLevelTest {

	use QueueInterceptor, BaseDatabasePopulator {

		BaseDatabasePopulator::setUp as databaseAllSetup;
	}

	protected function setUp ():void {

		$this->databaseAllSetup();

		$this->catchQueuedTasks();
	}
}
```

### Trigger tasks execution

Real-life tasks are executed asynchronously. However, doing so in the testing environment may preclude us from making informed decisions. When it's more desirable to execute immediately and observe side-effects of affected objects, short of hydrating the task independently and testing it as an independent class, the `catchQueuedTasks` method should be called with its first argument set to `true`.

```php

protected function setUp ():void {

	parent::setUp();

	$this->catchQueuedTasks(true);
}

public function test_queued_task_behavior () {

	// when // some operation expected to push task X onto the queue

	// task is automatically executed

	// then // observe side effects using any suitable mediums
}
```

Tasks executed using this method will not be recorded for later assertion.

When lower-level control over when exactly tasks are executed is preferred, invoke the `QueueInterceptor::processQueuedTasks` method after the operations expected to have logged it onto the queue.

```php

public function test_queued_task_behavior () {

	// given // some operation expected to push task X onto the queue

	$this->processQueuedTasks(); // when

	// then // observe side effects on collaborators
}
```

### Verifying queue state

When practising TDD, you may need to enforce that certain tasks are being pushed to the queue. We use the `assertPushed` and its inverse `assertNotPushed` for this.

```php

public function test_will_push_taskX_to_queue () {

	// when // some operation expected to push task X onto the queue

	$this->assertPushed(SomeTask::class); // then
}
```