## Introduction

The term *Middleware* refers to common functionality we want to run before or after a request hits its coordinator action handler. "Common" in this context describes behavior that is applicable to diverse endpoints. They **shouldn't** be used for purposes that don't directly interact with the request/response objects.

After evaluating pre-middleware collectors attached to the active route patterns, Suphle's request handlers will hand off control to the middleware stack attached to that route.

## Middleware stack

The stack built for each route is sourced from different channels. The origin of each middleware on this stack depends on the functionality it provides. After building the stack, it's executed in descending order. Middleware stacks are sourced from the following channels:

### Generic binding

Middleware defined with this method will be executed for all requests coming into your application. They exist as a convenience as it'll be unrealistic to bind them to each and every route declared on the application. Even if they're not explicitly applicable to all routes, we want to have them in place at a central location, functioning without manual binding to routes.

Generic middleware are declared on the `Suphle\Contracts\Config\Router` config like so:

```php

use Suphle\Config\Router;

class RouterMock extends Router {

	/**
	 * {@inheritdoc}
	*/
	public function defaultMiddleware ():array {

		return [
			
			SomeGenericMiddleware::class,

			AnotherGenericMiddleware::class,

			...parent::defaultMiddleware()
		];
	}
}
```

The default `Router` config already specifies base middleware. Unless you intend to overtake the internals of request handling, it's advised that these base middleware reside at the bottom of the stack.

### Route binding

This manner of pushing middleware onto the stack relies on the router to have composed a pattern out of the various collections matching incoming request. Middleware bound using this method will, unless detached by a lower-level collection, apply to the route eventually handled. Middleware stack built from the routing process is pushed to the top of the generic stack described above.

#### Attaching middleware to routes

Route-based middleware binding is defined by overidding our route collection's `_assignMiddleware` method with a binding to the registry it receives as argument.

A sample of such binding will look like this:

```php

use Suphle\Routing\{BaseCollection, Decorators\HandlingCoordinator};

use Suphle\Response\Format\Markup;

use Suphle\Middleware\MiddlewareRegistry;

use Suphle\Tests\Mocks\Modules\ModuleOne\{Coordinators\BaseCoordinator, Middlewares\Collectors\ActorsMiddlewareFunnel};

#[HandlingCoordinator(BaseCoordinator::class)]
class MultiTagSamePattern extends BaseCollection {

	public function NEGOTIATE () {

		$this->_get(new Markup("plainSegment", "generic.content"));
	}

	public function _assignMiddleware (MiddlewareRegistry $registry):void {

		$registry->tagPatterns(new ActorsMiddlewareFunnel(["NEGOTIATE"]);
	}
}
```

In spite of this API, middleware are closer to Coordinators than the route collections, since their existence is wrapped around the lifecycle and execution of eventual Coordinator. It's only more convenient to tag them on routes, instead, since it avails us the need to hydrate Coordinators before determining participating middleware.

Route-based middleware bindings leverage collectors that funnel any details necessary for its backing handler (the actual middleware) to function properly. Collectors are paired to their handlers in the `Suphle\Contracts\Config\Router::collectorHandlers` method:

```php

use Suphle\Config\Router;

use Suphle\Tests\Mocks\Modules\ModuleOne\Middlewares\{ActorsMiddleware, Collectors\ActorsMiddlewareFunnel};

class RouterMock extends Router {

	/**
	 * {@inheritdoc}
	*/
	public function collectorHandlers ():array {

		return array_merge(parent::collectorHandlers(), [

			ActorsMiddlewareFunnel::class => ActorsMiddleware::class
		]);
	}
}
```

#### Detaching inherited middleware

As with all other constructs applied to [route sub-collections](/docs/v1/routing#Route-prefixing) entry patterns, middleware bindings propagate to all patterns in those sub-collections. However, it's not uncommon for some of those patterns on the sub-collection to opt out of bindings from its parent collections. These can be exempted from the registry using its `removeTag` method.

Below, untagging a parent middleware is demonstrated.

```php

class MultiTagPrefix extends BaseCollection {

	public function NEGOTIATE () {

		$this->_prefixFor(UntagsMiddleware::class);
	}

	public function _assignMiddleware (MiddlewareRegistry $registry):void {

		$registry->tagPatterns(

			new ActorsMiddlewareFunnel(["NEGOTIATE"])
		);
	}
}

#[HandlingCoordinator(BaseCoordinator::class)]
class UntagsMiddleware extends BaseCollection {

	public function FIRST__UNTAGh () {

		$this->_get(new Markup("plainSegment", "generic.content"));
	}

	public function RETAIN () {

		$this->_get(new Json("plainSegment"));
	}

	public function _assignMiddleware (MiddlewareRegistry $registry):void {

		$registry->removeTag(

			["FIRST__UNTAGh"], ActorsMiddlewareFunnel::class
		);
	}
}
```

In this example, `removeTag` is invoked from an immediate sub-collection, although it's just as applicable to any sub-collection met on the tree while composing a URL pattern.

Both `removeTag` and `tagPatterns` return fluent interfaces for chaining as many binding sequences as your needs warrant.

## Defining middleware

Before deciding to implement target functionality as a middleware, it is strongly recommended that you reconsider there is no designated component, Suphle or otherwise, already designated for such feature. The likelihood that a middleware is well suited to accommodate a use-case increases with as many checkboxes below as it can tick:

- Wide applicability across multiple URL patterns. They are the interfaces of routing.
- It will either alter request execution path or contents/shape of response.
- It depends on details read from incoming payload.
- It doesn't precede routing decision e.g. coordinator/renderer choices. Routing work doesn't belong in middleware.

For instance, an implementation common among many web software is enforcing access-level-control through middleware. At worst, user status is evaluated and further execution terminated. Aside the risk of forgetting to bind this middleware to a relevant route pattern, it doesn't interact with the request or response objects in any way. It entirely is an [authorization](/docs/v1/authorization#Model-based-authorization) responsibility that should be handled in a more robust manner at the over-arching model or service level.

After confirming middleware is the way to go for given functionality, we can go about creating one by implementing the `Suphle\Contracts\Routing\Middleware` interface. A most basic middleware will look like this:

```php

use Suphle\Contracts\{Presentation\BaseRenderer, Routing\Middleware};

use Suphle\Middleware\MiddlewareNexts;

use Suphle\Request\PayloadStorage;

class SomeGenericMiddleware implements Middleware {

	public function process (

		PayloadStorage $request, ?MiddlewareNexts $requestHandler
	):BaseRenderer {

		return $requestHandler->handle($request);
	}
}
```

In its current state, `SomeGenericMiddleware` is redundant. For it to have any meaning, it has to collaborate with other dependencies to decide whether, or what side-effect to apply to incoming request flow. Often, these dependencies comprise of `PayloadStorage` or `PathPlaceholders`.

```php

public function process (

		PayloadStorage $request, ?MiddlewareNexts $requestHandler
):BaseRenderer {

	if ($request->hasHeader(self::SOME_HEADER))

		// take some action or update some other collaborator

	return $requestHandler->handle($request);
}
```

The higher up the stack a middleware is, the fresher `PayloadStorage` is and hasn't been tampered with by a preceding middleware. After walking down the stack, this same instance of `PayloadStorage` is passed down to all consumers below e.g. validation evaluator, payload readers, e.t.c.

It's safe to throw exceptions from this layer for requests not satisfying business requirements implemented on the middleware. The exception will bubble up to the over-arching exceptions handler, be it app or module-wide.

### Route-based middleware handlers

Most middleware Collectors will simply require route pattern gathering. Occassionally, one might find the need to feed the handler with additional parameters. However, while doing so, it's advisable that your enhanced collector has an `activePatterns` property as the Framework uses that to determine what route patterns it contains.

An implementation of `ActorsMiddlewareFunnel` that accepts additional arguments will look like this:

```php

use Suphle\Routing\CollectionMetaFunnel;

class ActorsMiddlewareFunnel extends CollectionMetaFunnel {

	public function __construct (

		protected readonly array $activePatterns,

		public readonly string $movieCharacter
	) {

		//
	}
}
```

It will then be defined as follows on the route collection:

```php

#[HandlingCoordinator(BaseCoordinator::class)]
class MultiTagSamePattern extends BaseCollection {

	public function NEGOTIATE () {

		$this->_get(new Markup("plainSegment", "generic.content"));
	}

	public function _assignMiddleware (MiddlewareRegistry $registry):void {

		$registry->tagPatterns(

			new ActorsMiddlewareFunnel(["NEGOTIATE"], "Dr. Ford"
		);
	}
}
```

That argument can then be consumed in the handler by intercepting the Collector's `movieCharacter` property. 

```php

use Suphle\Middleware\{CollectibleMiddlewareHandler, MiddlewareNexts};

use Suphle\Contracts\Presentation\BaseRenderer;

use Suphle\Request\PayloadStorage;

class ActorsMiddleware extends CollectibleMiddlewareHandler {

	public function process (

		PayloadStorage $request, ?MiddlewareNexts $requestHandler
	):BaseRenderer {

		$characterName = end($this->metaFunnels)->movieCharacter;

		if ($request->matchesContent("movie_star", $characterName))

			// set some value on the payload

		return $requestHandler->handle($request);
	}
}
```

Any number of collector instances bound to this handler that were attached while the route builder composed the eventual path, will be stored on the handler's `metaFunnels` property as an array of relevant `Suphle\Routing\CollectionMetaFunnel` instances. They can either be traversed or the most recent Collector can be read from the end.

### Post-coordinator execution

`ActorsMiddleware::process` has a statement that reads,

```php

return $requestHandler->handle($request);
```

The `$requestHandler` argument allows each middleware forward execution to the next one below it. Middleware can interrupt execution of subsequent middleware by excluding the statement.

At the end of the stack is a middleware that will bind result of coordinator action method to attached renderer. This renderer is flushed to user as-is. However, we can define a structure that modifies aspects of evaluated renderer -- usually, aspects not determinable from where renderer was bound to URL pattern. This is done by intercepting renderer returned by the forwarding statement. Suppose we want to add additional keys on all arrays returned by Coordinators this middleware is applied to, we'll adjust it as follows:

```php

public function process (

		PayloadStorage $request, ?MiddlewareNexts $requestHandler
):BaseRenderer {

	$originalRenderer = $requestHandler->handle($request);

	$originalRenderer->setRawResponse(array_merge(

		$originalRenderer->getRawResponse(), ["foo" => "baz"]
	));

	return $originalRenderer;
}
```

Even though `ActorsMiddleware` may have been ordered earlier in the stack, the method definition above would cause it to technically run after those below it.

## Testing middleware

Middleware should be tested by their definition, as regular PHP classes. This can be done using `IsolatedComponentTest`, stubbing out middleware's collaborators to yield expected results. However, if we want to test the middleware's integration as a whole, for example, the way it plays with other middleware or its application to a group or route patterns, we may require making middleware-specific observations. These can only be accomplished on module-level tests.

### Activating middleware

We may want to include or exempt one or more middleware from executing on match of a route it's been tagged to. Module-level tests provide the method `withMiddleware`, and its inverse `withoutMiddleware`, for making it convenient to do this. With `withMiddleware`, given middleware are being pushed to the forefront of the stack, regardless whether it was actually tagged to URL pattern.

```php

public function test_middleware_behavior_on_route_x {

	$this->withMiddleware([new ActorsMiddlewareFunnel("SEGMENT")]) // given

	->get("/segment/id") // when

	->assertOk(); // sanity check

	// then // some assertion with the above
}
```

The inverse method allows for omitting one or more middleware. It takes the same signature as `withMiddleware`. However, when called with no arguments given, all tagged middleware are terminated. Only default ones defined on router config will run.

These methods save us from mocking or doubling middleware classes. When greater control is required, for example, to inject middleware at specific index on the stack, you probably have to get your hands dirty with stubbing [the stack](#Generic-binding) or route collection as the case may be.

### Verifying middleware execution

When we want to verify whether a middleware has been obstructed by a preceding one or for internal development, we use the `assertUsedCollectorNames`, and its inverse `assertDidntUseCollectorNames`, assertion methods.

```php

public function test_middleware_x_runs_on_route_y {

	// given // maybe some precondition or this middleware simply being tagged to supposed pattern

	$this->get("/segment/id") // when

	->assertOk(); // sanity check

	$this->assertUsedCollectorNames([ActorsMiddleware::class]); // then
}
```

Both methods are complimented by the variants `assertUsedCollectors` and `assertDidntUseCollectors` that accept Collector instance instead of their names.

```php

public function test_middleware_behavior_on_route_x {

	 // some precondition if necessary // given

	$this->get("/segment/id") // when

	->assertOk(); // sanity check

	$this->assertUsedCollector([new ActorsMiddlewareFunnel("SEGMENT")]); // then
}
```