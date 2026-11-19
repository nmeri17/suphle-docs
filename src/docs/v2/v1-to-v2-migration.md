# Suphle v2 Migration Guide

> This document is a companion to the main v2 documentation. It is intended for developers migrating an existing v1 application to Suphle v2, providing before/after comparisons and step-by-step instructions for every major breaking change.

---

## 1. RouteCollection → Attribute Routing

The biggest architectural change in v2 is the elimination of separate `BaseCollection` route-definition classes. Routes are now defined as PHP 8 attributes directly on the **coordinator** method that handles them.

**v1 (Route Collections):**
```php
// AllModules/Users/Routes/UserRoutes.php
class UserRoutes extends BaseCollection
{
    public function USERS() {
        $this->_httpGet(new Markup("listUsers", "users.index"));
    }

    public function USERS_id() {
        $this->_httpGet(new Markup("showUser", "users.show"));
    }
}

// AllModules/Users/Coordinators/UserCoordinator.php
class UserCoordinator extends BaseCoordinator
{
    public function listUsers() { return ['users' => [...]]; }
    public function showUser()  { $id = ...; return ['user' => [...]]; }
}
```

**v2 (Attribute-Based):**
```php
// AllModules/Users/Coordinators/UserCoordinator.php
#[RoutePrefix("users")]
class UserCoordinator extends BaseCoordinator
{
    #[Route("/", HttpMethod::GET)]
    public function listUsers(): Markup
    {
        return new Markup('users.index', ['users' => $this->userService->getAll()]);
    }

    #[Route("/{id}", HttpMethod::GET)]
    public function showUser(): Markup
    {
        return new Markup('users.show', ['user' => $this->userService->find(
            $this->routeInfo->getSegmentValue("id")
        )]);
    }
}
```

### Method name conversion table

| Old Method Pattern | New Route Path |
|---|---|
| `USERS()` | `"/"` |
| `USERS_id()` | `"/{id}"` |
| `USERS_id_POSTS()` | `"/{id}/posts"` |
| `_index()` | `"/"` |

---

## 2. Canary System Redesign

**v1 (CanaryRoute with implicit fallback):**
```php
public function BETA() {
    $this->_httpGet(new CanaryRoute(
        new Markup("betaHandler", "beta.feature"),
        new Markup("stableHandler", "stable.feature")
    ));
}
```

**v2 (Explicit evaluation via match):**
```php
#[CanaryState([BetaUserCanary::class])]
class FeatureCoordinator extends BaseCoordinator
{
    #[Route("beta", HttpMethod::GET)]
    public function betaFeature(): Markup
    {
        $canaryState = $this->requestDetails->getCanaryState();
        return match($canaryState) {
            'beta'  => new Markup('beta.feature', ['data' => 'beta']),
            default => new Markup('stable.feature', ['data' => 'stable']),
        };
    }
}
```

No fallback handler. All logic is explicit and developer-controlled.

---

## 3. Renderer Changes

**`Reload` no longer accepts a handler parameter:**
```php
// v1
return new Reload($handler);

// v2
return new Reload($data);  // Framework auto-handles validation data
```

---

## 4. Payload Access Rename

```php
// v1
$data = $this->requestInput->getAll();

// v2
$data = $this->payloadReader->getAll();
```

---

## 5. Router Configuration API

**v1:**
```php
class RouterConfig extends Router
{
    public function browserEntryRoute(): string { return UserRoutes::class; }
    public function apiStack(): array           { return [ApiRoutes::class]; }
}
```

**v2:**
```php
class RouterConfig extends Router
{
    public function getCoordinatorPath(): string           { return "Coordinators"; }
    public function getCoordinatorClassesToScan(): array   { return [UserCoordinator::class]; }
}
```

---

## 6. RoutePrefix is NOT inherited

Each coordinator must declare its own complete `#[RoutePrefix]`. Parent class prefixes are ignored by the scanner. See [the routing chapter](/docs/v2/routing#RoutePrefix-is-NOT-inherited) for full details and the API versioning pattern.

---

## 7. API Versioning Pattern

Instead of redefining all routes for a new API version, extend the v1 coordinator and override only the changed methods:

```php
#[RoutePrefix("api/v2/products")]
class ProductsV2Coordinator extends ProductsV1Coordinator
{
    // All stable v1 methods are inherited and registered under the v2 prefix automatically.
    // Only override store() since its schema changed:
    #[Route("/", HttpMethod::POST)]
    public function store(): Json
    {
        return new Json(['version' => 'v2', 'schema' => 'new']);
    }
}
```

See the [Routing chapter](/docs/v2/routing#API-Versioning-via-Coordinator-Inheritance) for a full working example.
