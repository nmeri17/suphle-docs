## Introduction

Suphle v2 introduces a modern, attribute-based routing system that leverages PHP 8+ attributes to define routes directly on coordinator classes and methods. This approach provides better discoverability, type safety, and a more intuitive developer experience compared to the previous RouteCollection system.

The new routing system uses PHP attributes to define:
- Route patterns and HTTP methods
- Route prefixes for grouping related routes
- Middleware assignments
- Canary route configurations for feature flags

## Basic Route Definition

Routes are defined using the `#[Route]` attribute on coordinator methods. Each route specifies a pattern and HTTP method.

### Simple Routes

```php
use Suphle\Routing\Attributes\Route;
use Suphle\Routing\HttpMethod;
use Suphle\Response\Format\Json;

class UserCoordinator
{
    #[Route("users", HttpMethod::GET)]
    public function listUsers(): Json
    {
        return new Json([
            'users' => [
                ['id' => 1, 'name' => 'John Doe'],
                ['id' => 2, 'name' => 'Jane Smith']
            ]
        ]);
    }

    #[Route("users/create", HttpMethod::POST)]
    public function createUser(): Json
    {
        return new Json(['message' => 'User created successfully']);
    }
}
```

### Dynamic Route Parameters

Dynamic segments are defined using curly braces `{}` in the route pattern:

```php
#[Route("users/{id}", HttpMethod::GET)]
public function showUser(): Json
{
    $userId = $this->routeInfo->getSegmentValue("id");
    
    return new Json(['user' => $this->userService->find($userId)]);
}

#[Route("users/{id}/edit", HttpMethod::PUT)]
public function updateUser(): Json
{
    $userId = $this->routeInfo->getSegmentValue("id");
    
    return new Json(['message' => 'User updated successfully']);
}
```

## Named Routes

You can assign names to routes directly inside the `#[Route]` attribute using the `view_name` parameter. This makes it easy to generate URLs for those routes inside your views without hardcoding them.

```php
use Suphle\Routing\Attributes\Route;
use Suphle\Routing\HttpMethod;
use Suphle\Response\Format\Markup;

class ProductCoordinator
{
    public const SHOW_PRODUCT = 'products.show';

    #[Route("products/{id}", HttpMethod::GET, view_name: self::SHOW_PRODUCT)]
    public function showProduct(): Markup
    {
        $id = $this->routeInfo->getSegmentValue("id");
        return new Markup('products.show', ['id' => $id]);
    }
}
```

When you return a `Markup` response, Suphle automatically injects the `$namedRoutes` component into the template engine. You can then use it to generate the URL, supplying values for dynamic segments if needed:

```html
<!-- Inside your Blade or Twig view -->
<a href="{{ $namedRoutes->expandRoute(\App\Coordinators\ProductCoordinator::SHOW_PRODUCT, ['id' => 5]) }}">
    View Product
</a>
```

The `expandRoute` method will safely interpolate the parameters and trigger a `RuntimeException` if a parameter is missing or the route name doesn't exist.

## Route Prefixing

Use the `#[RoutePrefix]` attribute on coordinator classes to group related routes under a common prefix:

```php
use Suphle\Routing\Attributes\{Route, RoutePrefix};
use Suphle\Routing\HttpMethod;
use Suphle\Response\Format\{Json, Markup};

#[RoutePrefix("admin")]
class AdminCoordinator
{
    #[Route("dashboard", HttpMethod::GET)]
    public function dashboard(): Markup
    {
        return new Markup('admin.dashboard', [
            'stats' => $this->adminService->getStats()
        ]);
    }

    #[Route("users", HttpMethod::GET)]
    public function listUsers(): Json
    {
        return new Json(['users' => $this->userService->getAll()]);
    }

    #[Route("users/{id}", HttpMethod::DELETE)]
    public function deleteUser(): Json
    {
        return new Json(['message' => 'User deleted']);
    }
}
```

This creates routes like:
- `GET /admin/dashboard`
- `GET /admin/users`
- `DELETE /admin/users/{id}`

### RoutePrefix is NOT inherited

> [!IMPORTANT]
> `#[RoutePrefix]` is **not** inherited from parent classes. The router only reads the `#[RoutePrefix]` declared directly on each concrete coordinator class. If your coordinator does not declare its own `#[RoutePrefix]`, it will be **silently skipped** and none of its routes will be registered.
---

## API Versioning via Coordinator Inheritance

The most powerful use of `#[RoutePrefix]` is enabling **zero-duplication API versioning**. Because PHP's Reflection API exposes inherited public methods including their attributes, a V2 coordinator can extend a V1 one and _only_ override the endpoints that actually changed.

```php
// V1: three endpoints
#[RoutePrefix("api/v1/products")]
class ProductsV1Coordinator extends BaseCoordinator
{
    #[Route("/", HttpMethod::GET)]
    public function index(): Json   { /* ... */ }  // stable in v2

    #[Route("/{id}", HttpMethod::GET)]
    public function show(): Json    { /* ... */ }  // stable in v2

    #[Route("/", HttpMethod::POST)]
    public function store(): Json   { /* ... schema: legacy */ }  // changed in v2
}
```

```php
// V2: only define what changed. index() and show() are inherited automatically.
#[RoutePrefix("api/v2/products")]
class ProductsV2Coordinator extends ProductsV1Coordinator
{
    // index()  → GET /api/v2/products/         (inherited, no redefinition needed)
    // show()   → GET /api/v2/products/{id}     (inherited, no redefinition needed)

    // Only store() changed — override it here:
    #[Route("/", HttpMethod::POST)]
    public function store(): Json
    {
        return new Json(['version' => 'v2', 'schema' => 'new']);
    }
}
```

The scanner reads `getMethods(IS_PUBLIC)` on the V2 class, which returns all three methods (`index`, `show`, `store`) — two inherited, one overridden. All three get registered under the V2 prefix. **V1 routes remain completely untouched.**

## HTTP Methods


The `HttpMethod` enum provides type-safe HTTP method definitions:

```php
use Suphle\Routing\HttpMethod;

#[Route("users", HttpMethod::GET)]     // GET request
#[Route("users", HttpMethod::POST)]    // POST request
#[Route("users/{id}", HttpMethod::PUT)] // PUT request
#[Route("users/{id}", HttpMethod::DELETE)] // DELETE request
```

## Canary Releases (Feature Flags)

Suphle provides a clean, decoupled mechanism for implementing feature flags, A/B testing, temporary features, and gradual rollouts. Instead of scattering conditional logic across your front and back end code, Suphle centralizes decision-making into reusable **Canary Evaluators**.

### Defining Canary Evaluators

A **Canary Evaluator** is a class responsible for determining whether a specific condition is met (for example: user ID ranges, request headers, roles, or IP segments). To create one, implement `Suphle\Contracts\Routing\CanaryEvaluator`. The core method:

- `willLoad(): ?string`  
  - Return a **string slug** if the condition passes  
  - Return **null** if it fails

```php
use Suphle\Contracts\Routing\CanaryEvaluator;
use Suphle\Contracts\Auth\AuthStorage;

class BetaUserCanary implements CanaryEvaluator {

    public function __construct(
        protected readonly AuthStorage $authStorage
    ) {}

    public function willLoad(): ?string {
        $userId = $this->authStorage->getId();
        
        // Users under ID 1000 are part of the beta rollout
        return ($userId && $userId < 1000) ? 'beta' : null;
    }
}
```
#### Canary Evaluator Characteristics

- **First-Match Wins**: Evaluation stops as soon as one evaluator returns a non-null value. Later evaluators are not executed.

- **Decoupled Logic**: Each evaluator is:

    - A standalone class  
    - Fully testable in isolation  
    - Reusable across multiple Coordinators
    - Canary logic stays **explicit inside your Coordinator methods**

These keep behavior predictable and easy to debug. This model gives you precise control over feature exposure without compromising code clarity or performance.

- Always inject dependencies like `AuthStorage` or request abstractions. Avoid direct access to globals like `$_SESSION`.

---

### Registering Canaries

Attach evaluators to a **Coordinator class** using the `#[CanaryState]` attribute.

Suphle will evaluate them **in order**, stopping at the first match.

```php
use Suphle\Routing\Attributes\CanaryState;

#[RoutePrefix('api/v1')]
#[CanaryState([
    BetaUserCanary::class,
    EarlyAdopterCanary::class
])]
class UserCoordinator extends BaseCoordinator {
    public function __construct(protected readonly UserService $service) {}
}
```

---

### Consuming the Canary State

Canary evaluation is **lazy**—it only runs when explicitly requested.

#### In a Coordinator

Use `RequestDetails::getCanaryState()` to retrieve the active state:

```php
#[Route('/dashboard')]
public function dashboard(): Markup {
    $state = $this->requestDetails->getCanaryState();

    $input = $payload->getDomainObject();

    return match ($state) {
        'beta' => new Markup("/dashboard/v2-experimental", $this->service->dashBeta($input)),

        'early-adopter' => new Markup("/dashboard/v1-with-new-sidebar", $this->service->dashEarly($input)),

        default => new Markup("/dashboard/main", $this->service->dashMain())
    };
}
```

---

#### In Templates (Views)

You can either return views fully dedicated to the context or insert indicators in your existing templates by injecting the resolved state as a `canary_state` variable. It will allow for conditional rendering like so:

```html
@if ($canary_state == "beta")
    <!-- Show experimental UI -->
@endif
```

---

## Response Formats

Routes return response objects that define the output format:

### JSON Responses

```php
use Suphle\Response\Format\Json;

#[Route("api/users", HttpMethod::GET)]
public function listUsers(): Json
{
    return new Json([
        'users' => $this->userService->getAll()
    ]);
}
```

### HTML Responses

```php
use Suphle\Response\Format\Markup;

#[Route("users", HttpMethod::GET)]
public function showUsers(): Markup
{
    return new Markup('users.index', [
        'users' => $this->userService->getAll()
    ]);
}
```

### Redirects

```php
use Suphle\Response\Format\Redirect;

#[Route("users/create", HttpMethod::POST)]
public function createUser(): Redirect
{
    return new Redirect(function() {
        return '/users';
    });
}
```

### Reload (Form Validation)

```php
use Suphle\Response\Format\Reload;

#[Route("users/create", HttpMethod::POST)]
public function createUser(): Reload
{
    // Process the user creation
    $this->userService->create($this->payloadReader->getAll());
    
    // Return Reload - framework handles validation data automatically
    return new Reload();
}
```

**Note**: The `Reload` renderer is primarily used by the framework's validation system. When validation fails, the `ValidationFailureDiffuser` automatically creates a `Reload` renderer with validation errors and old input data. Use empty constructor to preserve v1 behavior.

## Router Configuration

The router configuration has been updated to support the new attribute-based system:

```php
namespace AllModules\YourModule\Config;

use Suphle\Config\Router;

class RouterMock extends Router
{
    public function getCoordinatorPath(): string
    {
        return "Controllers"; // Relative path to coordinator classes
    }

    public function getCoordinatorClassesToScan(): array
    {
        return [
            // List specific coordinator classes to scan, or empty array for all
            // Useful for test isolation
        ];
    }
}
```

### Coordinator Path

The `getCoordinatorPath()` method specifies the relative path to coordinator classes within each module. This path is combined with the module's root path to locate coordinator classes.

### Coordinator Filtering

The `getCoordinatorClassesToScan()` method allows filtering which coordinator classes should be scanned for routes. This is particularly useful for test isolation.

**Here's a cleaner, more honest, and better-structured version** of that section:

---

## Payload Handling

Suphle strongly encourages handling request input through **Payload Builders** (`ModelfulPayload`) and **Payload Readers** (`ModellessPayload`). These abstractions provide structure, centralize validation/hydration logic, prevent transport concerns from leaking into coordinators, and enable rich automatic documentation. They keep Coordinators thin and focused

They both wrap `PayloadStorage` which acts as the central source of truth for all request input and supports merging, querying, and transformation of payload data

Both base classes cover the vast majority of use cases and are covered in greater detail in [its relevant chapter](/docs/v2/service-coordinators#Builder-selects).

### Retrieving pattern segments

```php
// ModelfulPayload - for model-backed operations
class BaseProductBuilder extends ModelfulPayload
{
    protected function getBaseCriteria(): object
    {
        return $this->blankProduct->where([
            'id' => $this->payloadStorage->getKeyForPositiveInt('id')
        ]);
    }
}

// Usage in coordinator
public function showProduct(BaseProductBuilder $builder): Json
{
    return new Json([
        'product' => $this->productService->getResource($builder->getBuilder())
    ]);
}
```

This is the recommended pattern in almost all situations.

### Direct RouteInfo Access (Rare / Last Resort)

Every coordinator automatically receives the `routeInfo` property (populated by the framework before your action method runs). Using it should be treated as a last resort. Prefer `ModelfulPayload` (Builders) and `ModellessPayload` (Readers) in almost all situations.

**Acceptable use cases for direct `routeInfo` access:**

- Very simple scalar operations that don’t justify creating a dedicated Payload class.
- One-off operations where creating a Payload feels like over-engineering.

#### Example: Simple scalar operation

```php
#[Route("quick-check/{code}")]
public function quickStatusCheck(): Json
{
    $code = $this->routeInfo->getSegmentValue('code');

    $status = $this->statusService->checkQuickCode($code);

    return new Json([
        'valid' => $status->isValid,
        'message' => $status->message
    ]);
}
```

### RouteInfo Caution

If you find yourself needing `routeInfo` in many controllers (e.g. for logging, analytics, or tracking), consider using a [**middleware**](/docs/v2/middleware) instead. Global concerns like analytics, request logging, or metrics collection belong in middleware, not scattered across coordinators.

---

## CRUD Resources

Suphle provides a structured and opinionated approach to building standard CRUD (Create, Read, Update, Delete) resources. While the framework does not restrict you from defining routes manually, it encourages a consistent, reusable pattern that minimizes repetition and keeps your application logic organized.

Instead of repeatedly wiring controllers, services, and views, Suphle offers a scaffolding system that generates a complete working setup for a resource using the `route:crud` command.

```bash
php suphle route:crud Post
```

Running this command generates all the foundational components required to manage a **Post** resource.

### Command Options

- **`--is_api` (`-i`)**  
  Configures the Coordinator for JSON responses and skips HTML view generation. It also automatically adds an api/v1 mirror prefix

- **`--hydrating_module`**  
  Specifies the module where the generated files should be placed. If omitted, Suphle uses the default (primary) module.

---

### Scaffolding Output

The following components are created:

1. **Coordinator**  
   A `PostCoordinator` class containing all standard CRUD endpoints, already wired with `#[Route]` attributes.

2. **Payload Builders**  
   Classes like `BasePostBuilder` and `SearchPostBuilder` that wrap `PayloadStorage` and provide structured access to request data.

3. **Services**  
   Includes:
   - `PostAccessor` → Handles create/update operations  
   - `PostSearcher` → Handles filtering and search queries  

4. **Views (Non-API only)**  
   Templates for:
   - `.index` (listing)
   - `.create` (form)
   - `.show` (detail view)
   - `.edit` (edit form)

5. **Database Layer**  
   - An Eloquent model  
   - A migration file (preconfigured with basic fields like `id` and `title`)

---

### The CRUD Coordinator

All generated logic is grouped inside a Coordinator using the `#[RoutePrefix]` attribute.

Each method corresponds to a resource action and must return a **Renderer**. Suphle enforces this strictly—raw arrays or iterables are not allowed.

---

#### Standard Route Mapping

| HTTP Method | Path | Action | Returns |
| :--- | :--- | :--- | :--- |
| **GET** | `/posts` | `index` | `Markup` (List) |
| **GET** | `/posts/create` | `create` | `Markup` (Form) |
| **POST** | `/posts` | `store` | `Reload` or `Json` |
| **GET** | `/posts/{id}` | `show` | `Markup` (Detail) |
| **GET** | `/posts/{id}/edit` | `edit` | `Markup` (Form) |
| **PUT** | `/posts/{id}` | `update` | `Reload` or `Json` |
| **DELETE** | `/posts/{id}` | `destroy` | `Json` |
| **GET** | `/posts/search` | `search` | `Markup` (Results) |

---

Suphle’s CRUD system:

1. Automates boilerplate generation
1. Enforces consistent architectural patterns
1. Centralizes request handling via **Payload Builders**
1. Supports dual-mode (Browser + API) routing through mirroring
1. Remains fully customizable through attributes

It strikes a balance between **developer productivity** and **architectural clarity**.

## Native Renderers

In Suphle, **Renderers** are responsible for transforming the output of a Coordinator method into a final HTTP response. Rather than returning raw arrays or primitives, every action must return a Renderer, ensuring consistency across both browser and API contexts.

All native renderers extend a shared base (`GenericRenderer`) and expose a common method:

- `setHeaders(int $code, array $headers)`

This allows you to override HTTP status codes and headers at the final stage of the response lifecycle.

---

## Redirect

The `Redirect` renderer is used to navigate the user to a different URL. It behaves intelligently depending on the request context, making it one of the few **Mirror-aware** renderers in Suphle.

### Context-Aware Behavior

- **Browser Requests**  
  Returns a standard `302 Found` redirect.

- **API / JSON Requests**  
  Returns a `200 OK` response with a JSON payload:

  ```json
  { "redirect": "/target-url" }
  ```

This allows frontend clients (e.g., SPAs or mobile apps) to handle navigation manually instead of relying on HTTP redirects.

---

### Dynamic Destinations (Auto-wired Closures)

Instead of passing a static URL, the `Redirect` constructor accepts a `Closure`. This closure is **auto-wired** by the container at runtime.

This means:

- You can type-hint dependencies (services, config, etc.)
- Suphle will automatically resolve and inject them
- You can access the Coordinator's result via `$this->rawResponse`

```php
#[Route("payment/process", HttpMethod::POST)]
public function processPayment(): Redirect {
    return new Redirect(function (PaymentGateway $gateway) {
        // Access result from this method
        return $gateway->generateUrl(
            $this->rawResponse["transaction_id"]
        );
    });
}
```

### Important Note on Persistence

Since renderers may be serialized internally:

- Avoid directly capturing non-serializable objects (e.g., PDO, ORM models)
- Use **curried or nested closures** if needed to defer resolution safely

---

## Reload

The `Reload` renderer represents a **smart refresh** of the previous page.

Instead of redirecting blindly, it:

1. Retrieves the last `GET` renderer from session storage
2. Re-executes it
3. Merges the current action's result into it

### Key Characteristics

- **Default Status Code:** `200 OK`
- **State Preservation:** Maintains UI continuity (e.g., success messages after form submission)

```php
#[Route("feedback", HttpMethod::POST)]
public function handleFeedback(): Reload {
    $this->service->save(
        $this->payloadStorage->all()
    );

    return new Reload();
}
```

This is the preferred pattern for handling form submissions in Suphle.

---

## LocalFileDownload

`LocalFileDownload` extends `Redirect` and is designed for **serving files from the local filesystem**.

### Constructor Signature

```
LocalFileDownload(
    Closure $deriveFilePath,
    ?Closure $fallbackRedirect
)
```

### Behavior

- Dynamically resolves the file path using a closure
- Streams the file to the user if it exists
- Gracefully handles missing files via a fallback

### Features

- **Auto-wiring support** in both closures
- **Graceful failure handling** (optional redirect instead of crash)

```php
#[Route("invoice/{id}/download")]
public function downloadInvoice(int $id): LocalFileDownload {
    return new LocalFileDownload(
        function (ModuleFiles $files) use ($id) {
            return $files->activeModulePath() .
                "storage/inv_$id.pdf";
        },
        fn () => "/invoices/error"
    );
}
```

If the file is missing:

- A `404` is triggered
- User is redirected (if fallback is provided)

---

## Json

The simplest and most direct renderer.

It takes the Coordinator’s output and passes it through `json_encode`.

### Use Case

- API endpoints
- Lightweight responses
- Status checks

```php
#[Route("api/status")]
public function status(): Json {
    return new Json([
        "status" => "online"
    ]);
}
```

---

## Markup

The `Markup` renderer is used for **HTML responses**.

It requires:

- A template path
- Optional data to be passed into the view

### Use Case

- Server-rendered pages
- Dashboards
- Forms and UI views

```php
#[Route("dashboard")]
public function dashboard(): Markup {
    return new Markup("user.dashboard", [
        "stats" => $this->service->getStats()
    ]);
}
```

---

## Customizing Response Metadata

Since all renderers inherit from `GenericRenderer`, you can modify the final HTTP response before returning it.

### Example

```php
#[Route("custom-response")]
public function custom(): Json {
    $renderer = new Json([
        "message" => "Customized"
    ]);

    $renderer->setHeaders(
        202,
        ["X-Custom-Header" => "Value"]
    );

    return $renderer;
}
```

### What You Can Control

- **Status Code** (e.g., `200`, `202`, `404`)
- **Headers** (custom metadata, caching, etc.)

---

## Summary

Suphle’s Renderer system provides:

1. **Strict response consistency** (no raw outputs)
2. **Context-aware behavior** (Browser vs API)
3. **Flexible composition via closures**
4. **State-aware navigation (`Reload`)**
5. **Extensibility through shared base class**

Renderers are not just output formatters—they are a core part of Suphle’s request lifecycle and flow orchestration.

## Route Mirroring

**Route Mirroring** allows a Coordinator designed for the browser (HTML) to be automatically exposed as a JSON API. This ensures your application logic remains "Dry" while providing dedicated, versioned paths for API consumers. This allows you to maintain a single source of truth for logic while supporting multiple client types.

### Activating Mirroring

Mirroring is activated per-Coordinator using the `mirrorPrefix` argument in the `#[RoutePrefix]` attribute.

```php
use Suphle\Routing\Attributes\{Route, RoutePrefix};

#[RoutePrefix(
    prefix: "posts", 
    mirrorPrefix: "api/v1"
)]
class PostCoordinator {

    #[Route("")] // Browser: /posts | API: /api/v1/posts. Returns Json
    public function index(): Markup { ... }
}
```

### Authentication in Mirrored Routes

By default, the framework will inject the authentication mechanism most suitable for that environment

- **Browser Route:** `/posts`  
  Typically uses session-based authentication

- **API Route:** `/api/v1/posts`  
  Automatically switches to token-based authentication (e.g., JWT)

In order to customize this, we use the `mirrorAuthenticator` in the `#[RoutePrefix]` attribute:

```php
use Suphle\Routing\Attributes\RoutePrefix;
use Suphle\Auth\Storage\TokenStorage;

#[RoutePrefix(
    prefix: "profile", 
    mirrorPrefix: "api/v1/profile",
    mirrorAuthenticator: TokenStorage::class
)]
class UserProfileCoordinator {
    // ...
}
```

The user visiting a mirrored route must have authenticated via the mechanism provided in the `mirrorAuthenticator`. For instance, if they logged in via `/api/v1/login` and received a token, they can access `/api/v1/profile/details` even if the method attribute originally pointed to `SessionStorage`.

### Excluding Methods from Mirrors

If a specific browser-based method (like a complex UI flow) should not be exposed to the API, use the `excludeMethods` argument.

```php
#[RoutePrefix(
    prefix: "account", 
    mirrorPrefix: "api/v1", 
    excludeMethods: ["complexSignupFlow"]
)]
class AccountCoordinator {
    // This will NOT have an /api/v1/account/complex-signup-flow route
    #[Route("complex-signup-flow")]
    public function complexSignupFlow() { ... }
}
```

### Key Differences from Content Negotiation

Unlike standard content negotiation, Suphle Mirroring creates **dual paths**. This allows you to use different authentication mechanisms and response formats for the same logic without them clashing. While middleware-based negotiation changes the response based on headers, Suphle Mirroring provides:

1. **URL Clarity:** APIs have their own versioned paths (e.g., `/api/v1/...`).
2. **Security Decoupling:** You can swap a session-based browser authenticator for a token-based API authenticator automatically.
3. **Automatic Discovery:** We detect mirrored routes and includes them in API documentation and route lists without extra code.

---

## Route Discovery and Listing

Suphle provides a powerful route discovery system that allows you to inspect all routes across your application. This is particularly useful for debugging, documentation, and understanding your application's routing structure.

### Route List Command

You can get an overview of all routes across all modules in your application by running the `route:list` command:

```bash
php suphle route:list
```

This command provides a comprehensive table showing:
- **Method**: HTTP method (GET, POST, PUT, DELETE, etc.)
- **Path**: The route pattern
- **Handler**: The coordinator method that handles the route
- **Renderer**: The response renderer type
- **Middleware**: Any middleware applied to the route
- **Canary State**: Feature flag configuration
- **Placeholders**: Dynamic route parameters

#### Example Output

```
Route List
==========

+--------+------------------+------------------------+----------+------------+-------------+-------------+
| Method | Path            | Handler                | Renderer | Middleware | Canary State| Placeholders|
+--------+------------------+------------------------+----------+------------+-------------+-------------+
| GET    | /api/v1/users   | UserCoordinator::index | Json     | none       | none        | none        |
| POST   | /api/v1/users   | UserCoordinator::store | Json     | Auth       | none        | none        |
| GET    | /api/v1/users/1 | UserCoordinator::show  | Json     | none       | none        | id          |
| PUT    | /api/v1/users/1 | UserCoordinator::update| Json     | Auth       | none        | id          |
| DELETE | /api/v1/users/1 | UserCoordinator::delete| Json     | Auth       | none        | id          |
+--------+------------------+------------------------+----------+------------+-------------+-------------+

Total: 5 routes
```

#### Command Options

The `route:list` command supports several filtering options:

```bash
# Filter by module
php suphle route:list --module=ModuleOne

# Filter by HTTP method
php suphle route:list --method=GET

# Filter by path pattern
php suphle route:list --path=users

# Output in JSON format
php suphle route:list --json

# Combine filters
php suphle route:list --module=ModuleOne --method=POST --json
```

#### JSON Output Example

When using the `--json` flag, the command outputs structured JSON data:

```json
[
  {
    "method": "GET",
    "path": "/api/v1/users",
    "handler": "index",
    "renderer": "Suphle\\Response\\Format\\Json",
    "middleware": [],
    "canary_state": null,
    "placeholders": [],
    "coordinator": "App\\Modules\\User\\Coordinators\\UserCoordinator"
  },
  {
    "method": "POST",
    "path": "/api/v1/users",
    "handler": "store",
    "renderer": "Suphle\\Response\\Format\\Json",
    "middleware": ["App\\Middleware\\AuthMiddleware"],
    "canary_state": null,
    "placeholders": [],
    "coordinator": "App\\Modules\\User\\Coordinators\\UserCoordinator"
  }
]
```
---
## API Documentation Component

This component provides automatic OpenAPI documentation generation for Suphle applications. It scans all routes and generates comprehensive API documentation with request/response schemas, validation rules, and authentication requirements. It features the following:

- **Automatic Route Discovery**: Scans all registered routes and extracts metadata
- **OpenAPI 3.0 Specification**: Generates standards-compliant OpenAPI documentation
- **Response Schema Analysis**: Uses Psalm static analysis to infer response schemas
- **Validation Rule Integration**: Converts Laravel-style validation rules to OpenAPI schemas
- **Authentication Documentation**: Automatically detects and documents auth barriers
- **Component Template**: Plug-and-play installation without manual configuration
---

### Response Shape Inference

One of the most powerful features of Suphle’s API Documentation component is its **advanced static response shape inference engine**. It analyzes your coordinator code and produces **precise, structured response schemas** — not vague `{"type": "object"}` placeholders.

#### What It Handles Automatically

The analyzer is designed around real Suphle development patterns:

- Service calls that perform complex logic and ultimately return data:
  ```php
  return new Json([
      "data" => $this->employmentService->getResource($employmentBuilder->getBuilder())
  ]);

  // Inside EmploymentService.php
  public function getResource(Employment $query): IntegrityModel
  {
      // some advanced querying building here
      return $query->with('user')->get();   // or ->first(), paginate(), etc.
  }
  ```

- Direct builder usage in coordinators eg Associative arrays with mixed content
  ```php
  return new Json([
      "data" => $builder->getBuilder()->first(),
      "meta" => ["page" => 1]
  ]);
  ```
- Variables holding query results
  ```php
  $data = $this->editService->getResource($employmentBuilder->getBuilder());

  return new Json(["data" => $data]);
  ```
- Multiple return statements, match statements and basic ternaries
  ```php
  return new Json($condition ? $builder->getBuilder()->first() : []);
  ```
- Underlying model type underneath a generic collection of database objects

**No docblocks. No annotations. No rigid DTOs required. No maintenance overhead**

You can freely delegate heavy lifting to services while still getting rich, accurate response documentation.

#### Why This Is Significant

In dynamic languages like PHP, frontend teams often struggle because response shapes are unclear. Developers coming from strongly-typed backend ecosystems expect detailed response structures in their API docs.

This component solves that long-standing pain point.

You no longer need to maintain manual OpenAPI annotations or DTOs just for documentation. Even across dozens of routes, the system observes your real code and generates accurate schemas automatically.

#### Service Methods Returning Plain Values or DTOs

When a coordinator delegates through a plain service (not a ModelfulPayload
or model chain), the analyzer reads the return type of that service.

```php
public function genericWebhook(ExtractPaymentFields $payloadReader):Json
{
    return new Json([
        "data" => $this->transactionService->updateModels(
            $payloadReader->getDomainObject()
        )
    ]);
}
// TransactionService
public function updateModels(object $genericPaidDSL): Collection
{
    // ...
}
```

If `updateModels` declares a return type, that type is used directly:
- A builtin (`string`, `int`, `array`, `iterable`) maps to its scalar/array equivalent.
- A concrete class is read for its public property shape (a flat DTO read — not full ORM resolution).

#### Current Limitations

While the analyzer is effective for standard Suphle patterns, it has the following limitations:

- **Deeply nested custom DTOs** — Returns involving complex custom response objects or deeply nested DTOs will typically resolve to a generic `{"type": "object"}` without detailed properties.
- **Complex service method returns** — If a service method returns data through highly indirect or dynamic logic that is difficult to trace statically, the shape may not be fully resolved.
- **Very dynamic array construction** — Heavily dynamic array building (e.g. using loops with variable keys or runtime transformations) may not be fully captured.

---

### Installation

Install the component template:

```bash
## 
php suphle component:install ApiDocsTemplates
```

The routes will be available at:
- /api-docs (HTML documentation)
- /api-docs/json (OpenAPI JSON specification)

### Usage

#### HTML Documentation

Visit `/api-docs` to view the interactive HTML documentation with:
- Route summaries and descriptions
- Request/response examples
- Try-it-out functionality
- Authentication information

#### JSON Specification

Visit `/api-docs/json` to get the raw OpenAPI 3.0 specification for:
- Integration with external tools (Swagger UI, Postman, etc.)
- API client generation
- Documentation hosting

### Integration with External Tools

#### Postman

1. Import the OpenAPI specification from `/api-docs/json`
2. Postman will automatically generate a collection with all your endpoints
3. Authentication and request bodies will be pre-configured
