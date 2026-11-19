## Introduction

The term *Middleware* refers to common functionality we want to run before or after a request hits its coordinator action handler. "Common" in this context describes behavior that is applicable to diverse endpoints. They **shouldn't** be used for purposes that don't directly interact with the request/response objects.


## Default middleware

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

---

## Route binding
Middleware can be bound to routes at various points depending on the relevance or functionality expected of them.

### Security Middleware (`#[PreMiddleware]`)
During request lifecycle, these run first and are typically used for Authentication and Authorization. Instead of just a class name, they can accept an array of arguments.

```php
#[RoutePrefix("admin")]
#[PreMiddleware(AuthenticateHandler::class, [TokenStorage::class])]
class AdminCoordinator {

    #[Route("dashboard")]
    public function index(): Json { ... }

    /**
     * Overriding inherited rules: 
     * This route still uses AuthenticateHandler but swaps the rules entirely.
     */
    #[Route("super-secret")]
    #[PreMiddleware(AuthenticateHandler::class)]
    public function secret(): Json { ... }
}
```

### Defining custom middleware

Before deciding to implement target functionality as a middleware, it is strongly recommended that you reconsider there is no designated component, Suphle or otherwise, already designated for such feature. The likelihood that a middleware is well suited to accommodate a use-case increases with as many checkboxes below as it can tick:

- Wide applicability across multiple URL patterns. They are the interfaces of routing.
- It will either alter request execution path or contents/shape of response.
- It depends on details read from incoming payload.
- It doesn't precede routing decision e.g. coordinator/renderer choices. Routing work doesn't belong in middleware.

After confirming middleware is the way to go for given functionality, we can go about creating one by extending the `Suphle\Middleware\BaseMiddleware` class. Every middleware/handler class receives the arguments you passed in the attribute (like your list of rules) via the `setArgs` method.

```php
use Suphle\Contracts\{Presentation\BaseRenderer, Routing\Middleware};

use Suphle\Middleware\{MiddlewareNexts, BaseMiddleware};

use Suphle\Request\PayloadStorage;

class AltersPayloadStorage extends BaseMiddleware
{
    public function process(PayloadStorage $payloadStorage, ?MiddlewareNexts $requestHandler): BaseRenderer
    {

        $payloadStorage->setUpserts($this->payloadUpdates());

        return $requestHandler->handle($payloadStorage);
    }

    public function payloadUpdates(): array
    {

        return ["foo" => "bar"];
    }
}
```

### Binding secondary middleware

The `Suphle\Routing\Attribute\Middleware` attribute enables us apply middleware that should execute after pre-middleware. They can be applied at both the class and method level.

```php
use Suphle\Routing\Attribute\{Middleware, RoutePrefix, Route};

#[Middleware(AltersPayloadStorage::class)]
#[RoutePrefix("/api/v1")]
class ApiCoordinator {

    #[Route("profile")]
    public function showProfile() { ... }
}
```

---

### Clearing Inherited Middleware
The `Suphle\Routing\Attribute\ClearMiddleware` is often used to remove middleware inherited on a method by its parent class:

```php
#[PreMiddleware(AuthenticateHandler::class)]
class PublicCoordinator {

    #[ClearMiddleware(AuthenticateHandler::class)]
    #[Route("welcome")]
    public function landingPage() { ... } // Now public
}
```

This is for use when disengaging a middleware altogether. When a pre-middleware or middleware applied at the class level is also annotated on an individual method, the method-level configuration takes precedence rather than combining both. This pattern is useful when an endpoint requires unique arguments that are an exception to the class-level defaults, saving developers from having to detach and re-apply the entire middleware just to tweak its arguments.

---

### Post-coordinator execution

`AltersPayloadStorage::process` has a statement that reads,

```php

return $requestHandler->handle($payloadStorage);
```

The `$requestHandler` argument allows each middleware forward execution to the next one below it. Middleware can either interrupt execution of subsequent middleware by excluding that statement, or modifying value returned by it. Suppose we want to add additional keys on all arrays returned by Coordinators this middleware is applied to, we'd adjust it as follows:

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

Even though the middleware may have been ordered earlier in the stack, the method definition above would cause it to technically run after those below it.

## Testing middleware

Middleware should be tested by their definition, as regular PHP classes. This can be done using `IsolatedComponentTest`, stubbing out middleware's collaborators to yield expected results. However, if we want to test the middleware's integration as a whole, for example, the way it plays with other middleware or its application to a group or route patterns, we may require making middleware-specific observations. These can only be accomplished on module-level tests.

### Activating middleware

We may want to include or exempt one or more middleware from executing on match of a route it's been tagged to. Module-level tests provide the method `withMiddleware`, and its inverse `withoutMiddleware`, for making it convenient to do this. With `withMiddleware`, given middleware are being pushed to the forefront of the stack, regardless whether it was actually tagged to URL pattern.

```php

public function test_middleware_behavior_on_route_x {

	$this->withMiddleware([ActorsMiddlewareFunnel::class]) // given

	->get("/segment/id") // when

	->assertOk(); // sanity check

	// then // some assertion with the above
}
```

The inverse method allows for omitting one or more middleware. It takes the same signature as `withMiddleware`. However, when called with no arguments given, all tagged middleware are terminated. Only default ones defined on router config will run.

These methods save us from mocking or doubling middleware classes. When greater control is required, for example, to inject middleware at specific index on the stack, you probably have to get your hands dirty with stubbing [the stack](#Generic-binding) or route collection as the case may be.

### Verifying middleware execution

When we want to verify whether a middleware has been obstructed by a preceding one or for internal development, we use the `assertUsedMiddleware`, and its inverse `assertDidntUseMiddleware`, assertion methods.

```php

public function test_middleware_x_runs_on_route_y {

	// given // maybe some precondition or this middleware simply being tagged to supposed pattern

	$this->get("/segment/id") // when

	->assertOk(); // sanity check

	$this->assertUsedMiddleware([ActorsMiddleware::class]); // then
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
