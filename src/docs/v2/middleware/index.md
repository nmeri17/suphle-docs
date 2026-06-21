## Introduction

The term *Middleware* refers to common functionality we want to run before or after a request hits its coordinator action handler. "Common" in this context describes behavior that is applicable to diverse endpoints. They **shouldn't** be used for purposes that don't directly interact with the request/response objects.Got it — you want **one single Markdown code block**, with all inner code blocks **escaped** so they don’t render, and everything remains copy-paste safe.

---

#### 1. Security Middleware (`#[PreMiddleware]`)
These run first and are typically used for Authentication and Authorization. Instead of just a class name, they can accept an array of arguments.

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

#### 2. Standard Middleware (`#[Middleware]`)
These handle general request/response logic like JSON formatting or logging.

```php
#[Middleware(FormatJsonHandler::class)]
class ApiCoordinator {

    #[Route("profile")]
    public function showProfile() { ... }
}
```

---

#### 3. Clearing Inherited Middleware
If a class-level middleware is making a specific route inaccessible, you can "yank" it out using `#[ClearMiddleware]`.

```php
#[PreMiddleware(AuthenticateHandler::class)]
class PublicCoordinator {

    #[ClearMiddleware(AuthenticateHandler::class)]
    #[Route("welcome")]
    public function landingPage() { ... } // Now public
}
```

---

#### 4. The Backing Class (Handler)
The **Handler** is the code that actually runs. Every handler receives the arguments you passed in the attribute (like your list of rules) via the `setArgs` method.

```php
namespace App\Middleware;

class AuthenticateHandler extends BaseMiddleware {

    public function process(PayloadStorage $request, ?MiddlewareNexts $next): BaseRenderer
        
        foreach ($this->userArgs as $ruleClass) {
            $rule = $this->container->getClass($ruleClass);
            
            if (!$rule->permit()) {
                throw new Exception("Access Denied");
            }
        }
    }
}
```

---

### Quick Reference

| Type | Attribute | Use Case |
| :--- | :--- | :--- |
| **Global** | Defined in Config | Applied to every single request in the module. |
| **Security** | `#[PreMiddleware]` | Runs first. Used for login and permission checks. |
| **Standard** | `#[Middleware]` | Runs after security. Used for data processing. |
| **Negation** | `#[ClearMiddleware]` | Removes a specific handler inherited from the class. |
---

## Execution Lifecycle

The framework assembles the stack in the following order:

1.  **Default Middleware:** The outermost shell (e.g., CSRF).
2.  **Scrutinizers:** The security gate (Early exit if unauthorized).
3.  **Collectors:** The request/response processors.
4.  **Coordinator:** The target method logic.

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
