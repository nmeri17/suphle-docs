## Introduction

It's highly important that we simulate our software's shutdown state beforehand, how it handles unplanned input and scenarios, etc. There is an adage that says:

> To have peace, we must prepare for war.

Some of Suphle's central themes are those regarding exception management. As such, it's evident across almost all the components. These themes can be summarized as follows:

- That unintentional errors and exceptions should never terminate user request. The error 500 page is a sign that user has performed an unanticipated action and gives the impression of an unprepared, short-sighted developer behind the scenes.

- Logging is a flawed reaction to a software's tumultuous termination. Careful developers in other frameworks integrate notification tools to indicate when things go wrong. But it should be mandatory for all developers.

Bearing them in mind, we'll examine how Suphle goes about achieving these goals.

## Handling deliberate exceptions

Developers are encouraged to disrupt request execution when an unpermitted action takes place. It requires developer to have anticipated violations of one or more business rules beforehand. Suphle itself throws diverse exceptions at different occassions targeting both the end user and software's developers. For each thrown exception, there ought to be a waiting handler to nicely inform user what they did wrong.

In Suphle, exceptions are paired to their handlers through the `Suphle\Contracts\Config\ExceptionInterceptor::getHandlers` config method. Its default implementation is `Suphle\Config\ExceptionConfig`. The method is expected to return a key-value pair of `Throwable`s to exception diffusers. The following diffusion pairings exist:

```php

public function getHandlers ():array {

	return [
		NotFoundException::class => NotFoundDiffuser::class,

		Unauthenticated::class => UnauthenticatedDiffuser::class,

		ValidationFailure::class => ValidationFailureDiffuser::class,

		UnauthorizedServiceAccess::class => UnauthorizedDiffuser::class,

		EditIntegrityException::class => StaleEditDiffuser::class
	];
}
```

There's also a universal diffuser for handling all other sorts of exceptions without explicit diffusers. This can be set through `ExceptionInterceptor::defaultHandler`.

```php

public function defaultHandler ():string {

	return GenericDiffuser::class;
}
```

### Exception diffusers

Diffusers enable us customize how exceptions are handled and dictate what renderer will be used to materialize a response. Suphle's exception component publishes presentation [templates](/docs/v1/component-templates) for its available diffusers. Unless you wish to modify underlying behavior, it's enough to only tamper with templates published for the exceptions.

#### Writing custom diffusers

If you're throwing a custom exception that should be covered by its own diffuser, you'll want to implement the `Suphle\Contracts\Exception\ExceptionHandler` interface, and pair it to the exception it handles as instructed above. It has the following signature:

```php

use Suphle\Contracts\Presentation\BaseRenderer;

use Throwable;

interface ExceptionHandler {

	public function setContextualData (Throwable $origin):void;

	public function prepareRendererData ():void;

	public function getRenderer ():BaseRenderer;
}
```

- `setContextualData` is first to be called, receiving the exception itself for possible use in crafting response contents.

- `prepareRendererData` is where actions that run before rendering is done are performed. Renderer that should be flushed for this request should be set here.

- `getRenderer` determines the ultimate renderer user would receive.


## Handling unexpected errors

This refers to irrecoverable errors or exceptions during execution that user is innocent of. They could be syntax errors or due to running untested code. Whatever be the case, it's our responsibility not to display the error's stack trace and to swing into action in resolving the failure.

This sort of error is be managed by `Suphle\Modules\ModuleExceptionBridge`; a class home to hooks enabling us decide what happens when the well-being of incoming request has been jeopardized, namely:

- `gracefulShutdown` and,

- `disgracefulShutdown`.

If their implementation doesn't suit you, you can bind to a custom one in your titular `Suphle\Contracts\Modules\DescriptorInterface`.

```php

use Suphle\Modules\ModuleExceptionBridge;

protected function registerConcreteBindings ():void {

    parent::registerConcreteBindings();

    $this->container->whenTypeAny()->needsAny([

    	ModuleExceptionBridge::class => $customExceptionBridge
    ]);
}
```

The default behavior of `gracefulShutdown` is:

- It collects information about the offending action,
- Forwards it the connected notification service,
- Serves the renderer for generic errors.

When a call to `gracefulShutdown` fails due to another error, Suphle gives developer one last chance to redeem himself, using the `disgracefulShutdown` method. This should never occur, but if it does, we need to take an action with the greatest chance of leaving evidence behind. Writing to a file is relatively reliable but is insufficient since it doesn't actually call anybody to action. Thus, Suphle's handling follows the sequence below:

- Writes to the error log defined in `ExceptionInterceptor::shutdownLog`. Default implementation returns a file path: "module/path/shutdown-log.txt".

- Sends an email using a shutdown alerter.

- Responds to user request using whatever text is returned from `ExceptionInterceptor::shutdownText`.

It still takes I/O into account, but traditional ones expected to be reliable. If you intend to override it, or to fortify your program against this eventuality, remember that the less fancy action taken here is, the safer for all parties. Assume all else has failed and this is the last ditch of last ditches. The fewer dependencies required to execute this step, the better.

### Shutdown alerters

These are mechanisms put in place to notify a software's maintainers of critical failure. For rapid reflex, it should point to a well-monitored channel. Shutdown alerter are expected to implement the `Suphle\Contracts\Exception\FatalShutdownAlert` interface. The mail alerter is used as default implementation. Under the hood, this implementation relies on `Suphle\Exception\ShutdownAlerters\MailBuildAlerter` mail builder, which requires the following environment variables:

- `MAIL_SHUTDOWN_RECIPIENT`

- `MAIL_SHUTDOWN_SUBJECT`

The email address given would receive the stack trace as message body. If this outcome is not suitable to you for mail alerting, it should be substituted with a more fitting implementation of `FatalShutdownAlert`.

## Broadcasting exception details

*Broadcasting* here, refers to sending signals notifying a project's maintainer of a fault observed within the system. This is used either as an alternative or in conjunction with the traditional response to error -- logging them and their severity.

Almost all exceptions in Suphle are being broadcasted to the connected adapter. This includes caught exceptions, request-crippling errors, those caught within error-catching decorators, etc. It does this using the `Suphle\Exception\DetectedExceptionManager` class. Afterwards, it queues as much context-specific detail as is relevant. When those tasks eventually run, the stored payload will be sent to any available notification service. Stored payload differs from invoker to invoker. For example, `BaseHttpRequest` will send the response body as payload, while `ServiceErrorCatcher` and its sub-decorators will send details such as request payload and user ID.

Unless you're developing a library, you'll have little use for directly invoking `DetectedExceptionManager` since it's used in a number of higher-level components utilized in user-land.

### Broadcaster adapters

These adapters are wrappers around the 3rd-party service involved in relaying message to the developer in real-time. These services will require you create an account on their platform, then integrate some SDK. Suphle will expect your SDK to implement the `Suphle\Contracts\Exception\AlertAdapter` interface. It has the following signature:

```php

use Throwable;

	interface AlertAdapter {

	public function broadcastException (Throwable $exception, $activePayload):void;
}
```

The default service connected in Suphle is [Bugsnag](bugsnag.com). Their client SDK requires the presence of the following [environment variables](/dpcs/v1/environment), that would all be provided to you after setting up an account on their platform:

- `BUGSNAG_API_KEY`

- `BUGSNAG_ENDPOINT`

Needless to say, their presence is mandatory for exception broadcasting to function properly.

When an exception notification is broadcast, the maintainer should:

- Use all details received to replicate conditions under which failure occured, but in a test environment.
- Rectify the situation.
- Re-run originally intended action on behalf of the user.

### User-triggered exceptions

Certain exceptions are developer-legitimate, user-triggered e.g. authentication exceptions. It's not reasonable for developer to get notified about them. Suphle provides the `Suphle\Contracts\Exception\BroadcastableException` marker interface for use in distinguishing user-triggered errors that should send out notifications to the software's maintainers.

When caught, exceptions implementing this interface will have the string returned by their `getMessage()` method broadcasted by connected service. Such exceptions fall under the category of "foreseen and deliberate" discussed above. Syntax errors or uncaught exceptions will be broadcasted for you as a generic `Exception`.

## Testing shutdown and exceptions

PHPUnit already provides the asserter `expectException` for verifying that direct calls result in certain exceptions being thrown. In the context of a framework, we attempt to handle exceptions for you so they don't spill out into user-land. Thus, we require additional constructs to confirm foreseen exceptions are thrown and that application completes designated sequence before crashing when it encounters unexpected errors.

### Debugging application errors

Within the test environment, it's safe not to receive alerts about our broken program. Furthermore, some failing tests won't give sufficient detail regarding the reason behind their failure since they're handled by higher level constructs. For these reasons, the exception manager is replaced in all tests with a double whose behavior depends on your needs.

#### Debugging exception broadcast

High-level, user-facing classes powered by the exception manager, `DetectedExceptionManager` have internal mechanisms for managing exceptions. While invocations to problematic classes won't throw exceptions on the surface (as intended), they'll equally not be broadcasted as they would've been in a live environment. To force these kind of classes to immediately divulge exceptions thrown within, the test should set its `muffleExceptionBroadcast` property to `false`.

```php

class DecoratedServiceTest extends ModuleLevelTest {

	protected $muffleExceptionBroadcast = false;

	public function test_service_call () {

		$result = $this->getContainer()->getClass(DecoratedService::class)

		->doThing(); // when. Always returns a value

		// then, some assertion that won't run if above call ran into an error.
	}
}
```

#### Debugging HTTP exceptions

When we automate HTTP tests into our application, the test won't fail if it encounters an error; rather, the call will return a response object with a payload containing formatted error-handled message, along with status code 500.

Often, this isn't very helpful when trying to determine the reason test is not passing and would require reading possibly mangled response from the CLI. In order to prevent this, we want failing HTTP tests to terminate before reaching associated exception diffuser. This is achieved by setting class property `debugCaughtExceptions` to `true`.

```php

class TriggerHTTPTest extends ModuleLevelTest {

	protected $debugCaughtExceptions = true;

	public function test_http_endpoint () {

		$this->putJson("/segment", [

			"some" => "payload"
		]); // when

		// then, some assertion that won't run if above call ran into an error.
	}
}
```

These debug constructs should be removed from the test class after deciphering what's wrong behind the scenes.

### Specific exception testing

In preceding sections, we looked at what happens when exceptions are encountered incidentally. Now, we'll see how to verify expected exceptions, broadcasting, safe-guarding against catastrophic shutdown sequences.

Tests that want to trigger an action and introspect system behavior afterwards are expected to extend the special test-type `Suphle\Testing\TestTypes\InvestigateSystemCrash`. It contains an abstract method `getModule` required to return just one module, implying it's only necessary on your titular module. This is because it's either this or module that received routing request that Suphle will use in hydrating the exception bridge for flushing response.

#### Testing shutdown sequence

*Shutdown* in this context refers to what happens when application encounters an irrecoverable, unexpected error. Testing this aspect of our program is indispensable. As such, default module template comes with some tests for verifying our exception hooks run smoothly. These tests contain the following verifications:

- `YourModule\Tests\Exceptions\GracefulShutdownTest` compares returned renderer with expected generic markup renderer (in the absence of API prefix in request path). As always, error broadcasting abilities are tamed. If this sort of sandboxed testing is not realistic enough for you, you can either use `Container::refreshClass` or `InvestigateSystemCrash::provideTestEquivalents` to prevent `QueueAdapter` from getting stubbed out.

- `YourModule\Tests\Exceptions\DisgracefulShutdownTest` asserts error logging to a dummy file on your filesystem is possible, correct contents were inserted. It also verifies `disgracefulShutdown` indeed returns values from connected exception config. Internally, the alerter adapters are stubbed out for you, to re-throw any exceptions received along the way (See `Suphle\Testing\Proxies\ExceptionBroadcasters::getExceptionDoubles`).

If you took the trouble to customize any of the hooks, you're welcome to substitute the tests with more applicable ones.

#### Exception-level assertions

`InvestigateSystemCrash` contains the following assertions:

##### assertWillBroadcast

We use this method and its inverse, `assertWontBroadcast`, to verify whether a failable operation behaves as intended. It allows for testing this functionality without the overhead of contacting underlying broadcast service. Both methods accept a callback to invoked before outcome verification and return result of this callback.

```php

public function test_failable_service_fails_on_x () {

	$sut = $this->getContainer()->getClass(FailableService::class);

	$result = $this->assertWontBroadcast(function () use ($sut) {

		return $sut->someOperation();
	}); // when

	// then
	$this->assertTrue($sut->matchesErrorMethod("someOperation"));
}
```

##### assertWillCatchException

This method is conceptually similar to PHPUnit's `expectException`. The reason it exists is for anticipating exceptions during framework-handled operations such as inward HTTP requests. Its signature takes as argument expected exception name, callback carrying operation, and an optional message string on failure to catch such exception.

```php

public function test_unauthorized_getter_throws_error () {

	$this->assertWillCatchException(EditIntegrityException::class, function () { // then

		$this->get("admin/gmulti-edit-unauth"); // when
	}, EditIntegrityException::NO_AUTHORIZER);
}
```

##### assertExceptionUsesRenderer

We use this method when writing custom exception diffusers or modifying existing ones, to determine whether it evaluates to the correct renderer. It performs a shallow comparison of renderer handlers rather than a deep one. Suppose our `NotFoundException` exception sports a diffuser with a renderer handled by a `missingHandler` method, we'd assert it runs successfully like so:

```php

public function test_exceptions_uses_assigned_handler () {

	$this->assertExceptionUsesRenderer( // then
	
		new Markup("missingHandler", ""),

		function () {

			throw new NotFoundException; // when
		}
	);
}
```

The callback will be ran in the context of given module, and the test-type will be expect an exception to be thrown, as well as for its complementary handler to return a renderer matching expected one. The assertion above will fail if no exception is thrown.