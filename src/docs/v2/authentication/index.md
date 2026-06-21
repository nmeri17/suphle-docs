## Introduction

Authentication in Suphle focuses on credential verification and session persistence. By utilizing the **Auth Repository**, you can handle both stateful (Browser) and stateless (API) logins with minimal boilerplate.

### Using the Auth Repository

The `BaseAuthRepo` provides the core logic for checking credentials via the `ColumnPayloadComparer` and persisting the result. In most cases, you do not need to extend this class unless you are adding custom domain events (like sending a "New Login" email).

Instead, you can inject it directly into your Coordinator and use its status methods to drive a `match` expression.

#### Coordinator Implementation

```php
class LoginCoordinator extends BaseCoordinator {

    public function __construct(
        protected readonly BaseAuthRepo $authService
    ) {}

    #[Route("login", HttpMethod::POST)]
    public function browserLogin(): BaseRenderer {

        return match ($this->authService->tryStartUserSession()) {
            null => new Reload(), // Failed: returns to form with previous data

            default => new Redirect(
                $this->authService->successRedirect("/dashboard")
            )
        };
    }

    #[Route("api/v1/login", HttpMethod::POST)]
    public function apiLogin(): Json {
        $token = $this->authService->tryGetJsonToken();

        return match (is_null($token)) {
            false => new Json(["token" => $token]),
            
            true => new Json(["error" => "Unauthorized"], 401)
        };
    }
}
```

-----

### Handling Login Failures & UI Recovery

When a login attempt fails (returning `null`), using the `Reload` renderer triggers Suphle's internal redirection logic. This is handled by the framework's [Validation & Error Diffusers](/docs/v2/coordinators#Checking-for-validation-errors).

  * **Error Detection**: On the frontend, you can check for the presence of `"validation_errors"` to show an alert.
  * **Data Persistence**: You don't need to manually pass the email back to the login form. The previous request data is automatically stored and can be retrieved via the `"payload_storage"` key. See [Restoring request data](/docs/v2/coordinators#Restoring-request-data) for details.

### Success State & Identity

Once `tryStartUserSession()` succeeds, the user's information is persisted in the session. There is no need to return user objects or email addresses in the login response; the frontend should simply redirect to the authenticated dashboard and fetch user details from the global session state or a dedicated `/me` endpoint.

-----

### Advanced: Customizing Credential Matching

The logic that dictates *what* constitutes a valid login is encapsulated in the `Suphle\Contracts\Auth\ColumnPayloadComparer`. The default implementation is `Suphle\Auth\EmailPasswordComparer`, which matches the `email` payload key against your user table.

#### Changing the Identifier

If you want to use a `username` instead of `email`, you can simply extend the default comparer:

```php
class UsernamePasswordComparer extends EmailPasswordComparer {

    protected string $columnIdentifier = "username";
}
```

#### Complex Identification

If a simple column match isn't enough (e.g., checking if a user is also "active"), or a multi-tenant login (where you need `company_id` + `email`), you can override `findMatchingUser` to leverage the `UserHydrator` directly. The `BaseAuthRepo` will automatically use your new logic without you having to touch the service or coordinator code:

```php
protected function findMatchingUser(): ?UserContract {

    return $this->userHydrator->findAtLogin([
        "username" => $this->payloadStorage->getKey("username"),
        "status" => "active"
    ]);
}
```

#### Binding Your Custom Comparer

To tell Suphle to use your custom logic, bind it in your module's container as you would any other [Interface](/docs/v2/container#Providing interfaces):

```php
public function simpleBinds ():array {

        return array_merge(parent::simpleBinds(), [

            ColumnPayloadComparer::class => UsernamePasswordComparer::class
        ]);
    }
```

-----

### Internal persistence Mechanisms

| Method | persistence | Use Case |
| :--- | :--- | :--- |
| `tryStartUserSession()` | `SessionStorage` | Secure, cookie-based sessions for web browsers. |
| `tryGetJsonToken()` | `TokenStorage` | JWT/Bearer tokens for mobile apps or third-party integrators. |


-----

## The EloquentAuth Template

The `EloquentAuth` component template provides a complete, editable authentication and registration suite. Unlike standalone modules, these files are deposited directly into your module, allowing you to customize the domain logic and UI layouts without architectural friction.

### Ejected Components

Upon installation, the following structure is mirrored into your module:

  * **`Coordinators\BrowserAuthCoordinator`**: Manages the web-based lifecycle (Login, Register, Logout, Verification) including CSRF and validation recovery.
  * **`Coordinators\ApiAuthCoordinator`**: A stateless counterpart for JSON-based authentication.
  * **`Services\RegisterService`**: A mutative service implementing `SystemModelEdit` to handle account creation and email verification.
  * **`PayloadReaders\RegistrationReader`**: Normalizes incoming registration data into a domain-safe format.
  * **`Views\auth\`**: Contains the Blade templates for login and registration forms.

### Installation

To eject these files into your module, run the installation command:

```bash
php suphle templates:install SuphleIdentity
```
The ideal workflow would look like this:

```bash
php suphle modules:create Identity && php suphle templates:install SuphleIdentity
```

### UI Recovery & State

The ejected views leverage the `payload_storage` and `validation_errors` keys. If a registration fails, the `Reload` renderer ensures the user is returned to the form with their previous input intact and errors highlighted, as described in [Restoring request data](/docs/v2/service-coordinators#Restoring-request-data).

-----

## Authentication in the application

The following sections cover how to protect our routes from unauthenticated access, how to retrieve an instance of the current user and how to impersonate users using privileged access.

### Securing Routes

A number of authentication mechanisms are used in practice, depending on the capabilities of the client device the application is being built for. Suphle implements the two most common of these: session-based authentication and JWTs. In the current architecture, authentication is defined directly on the Coordinator methods via attributes. When a developer protects a route using a certain mechanism, it limits resource access to user requests that provide the corresponding credentials.

## The Authenticate Attribute

In Suphle, the `Suphle\Contracts\Auth\AuthStorage` interface represents the storage mechanism (Session or Token). To secure a route, we use the `#[PreMiddleware]` attribute with `AuthenticateHandler` directly on the Coordinator method.

```php
namespace App\Coordinators;

use Suphle\Routing\Attributes\{RoutePrefix, Route, HttpMethod, PreMiddleware};
use Suphle\Auth\Middleware\AuthenticateHandler;
use Suphle\Auth\Storage\SessionStorage;
use Suphle\Response\Format\Json;
use Suphle\Services\BaseCoordinator;

#[RoutePrefix("profile")]
class UserProfileCoordinator extends BaseCoordinator {

    #[Route("/details", HttpMethod::GET)]
    #[PreMiddleware(AuthenticateHandler::class, [SessionStorage::class])]
    public function getDetails(): Json {
        
        return new Json([
            "user" => "identified_user_data",
            "status" => "active"
        ]);
    }
}
```

By default, `AuthenticateHandler` will resolve to the default authentication mechanism bound in your container. If you provide a specific `storage` class in the attribute arguments, the framework will use that mechanism to validate the visitor.

## Detaching in methods

In this architecture, attributes can be applied at the class level to secure every method within that Coordinator. When security is inherited from the class attribute, specific methods can be exempted using the `#[ClearMiddleware]` attribute.

```php
namespace App\Coordinators;

use Suphle\Routing\Attributes\{RoutePrefix, Route, HttpMethod, PreMiddleware, ClearMiddleware};
use Suphle\Auth\Middleware\AuthenticateHandler;
use Suphle\Response\Format\Json;
use Suphle\Services\BaseCoordinator;

#[RoutePrefix(prefix: "account")]
#[PreMiddleware(AuthenticateHandler::class)]
class AccountCoordinator extends BaseCoordinator{

    #[Route("/public-info", HttpMethod::GET)]
    #[ClearMiddleware(AuthenticateHandler::class)]
    public function getPublicInfo(): Json {
        
        return new Json([
            "organization" => "Suphle Framework",
            "type" => "Open Source"
        ]);
    }
    
    #[Route("/private-settings", HttpMethod::GET)]
    public function getSettings(): Json {
        
        return new Json([
            "email" => "user@example.com",
            "theme" => "dark"
        ]);
    }
}
```

Now, requests to `/account/public-info` will no longer discriminate against the authentication status of the visitor, while `/account/private-settings` remains secured by the class-level middleware.

## Enforcing User Verification

Often, it's not enough for a visiting user to be authenticated; they must also have verified their account via email or phone. To achieve this, stack the `UserIsVerified` after the `AuthenticateHandler`.

```php
namespace App\Coordinators;

use Suphle\Routing\Attributes\{Route, HttpMethod, PreMiddleware};
use Suphle\Auth\Middleware\AuthenticateHandler;
use Suphle\Adapters\Orms\Eloquent\Middleware\UserIsVerified;
use Suphle\Response\Format\Json;
use Suphle\Services\BaseCoordinator;

#[RoutePrefix("/secure-data")]
class SecureCoordinator extends BaseCoordinator {

    #[Route("/sensitive")]
    #[PreMiddleware(AuthenticateHandler::class)]
    #[PreMiddleware(UserIsVerified::class)]
    public function getSensitiveData(): Json {

        return new Json([
            "data" => "Internal encrypted records"
        ]);
    }
}
```

This middleware takes optional arguments that defaults to,
```php
#[PreMiddleware(UserIsVerified::class, [
    "verification_url" => "/accounts/verify",

    "verified_field" => "email_verified_at"
])]
```
`verification_url` argument specifies where the user should be sent to commence verification. If the request is an API call, the visitor receives a JSON response with the destination; browser users are redirected. If your verification logic transcends a simple column check, you can replace this middleware with a custom one.

## Retrieving user instance

Wherever the container sees the type-hint `Suphle\Contracts\Auth\AuthStorage`, it'll either inject the default bound mechanism or the one used to authenticate a user if it's a secured route. The default binding is `Suphle\Auth\Storage\SessionStorage`, a session-based implementation that unless replaced, will be returned on routes without authentication. For obtaining users from the mechanism, `AuthStorage` defines the `getUser` method. It's only capable of returning `null` for unprotected routes where user presence is optional. Resources at such routes are intended for consumption by both authenticated and unauthenticated parties.

### Unique mechanism features

For whatever mechanism is active, there are one or two distinct features you'll want to be aware of. They both implement multi-user login -- a phenomenon applicable in hierarchial applications where it may be necessary for a privileged user to browse as one with lesser authorities -- but it's more pronounced under session-based authentication.

- `Suphle\Auth\Storage\TokenStorage`
This requires the presence of certain env variables. They are already defined in the .env file that comes with a fresh Suphle installation. Multi-user login is achieved by calling `Suphle\Contracts\Auth\AuthStorage::imitate(string $newIdentifier)`, rather than successive calls to logout and log back in. This mechanism will return a token for the given identifier. It is expected that the client will store the parent identifier and be responsible for reverting to it.

- `Suphle\Auth\Storage\SessionStorage`
This mechanism uses the same signature as above for impersonation purposes. However, the state of both active users are stored on the server. You would typically hide the route that triggers this functionality under an administrative [authorization](/docs/v2/authorization#Route-based-authorization).

Suppose you're building a multi-tenant system where the admin wants to view a vendor's dashboard without their login credentials, we would conditionally display a button on the dashboard,

```php
if ($sessionStorage->hasActiveAdministrator())

	// display revert to admin button
```

It will return true if an earlier user is impersonating another. After we're done inspecting and wish to return to administrative duties, we'll obtain admin identifier and use that to restart our session. Our "Revert to admin" button will post to an endpoint with the following code, before redirecting to the admin dashboard:

```php
$sessionStorage->startSession($sessionStorage->getPreviousUser());
```

Note the use of `startSession()` here instead of `imitate()`. This is because `imitate()` is strictly for setting the superior-level to revert to -- the getaway driver, if you like.

## Logging out

The framework can be instructed to invalidate current authenticated status by calling `Suphle\Contracts\Auth\AuthStorage::logout()` method from anywhere. Henceforth, `Suphle\Contracts\Auth\AuthStorage::getUser()` will yield `null` when invoked. When the session-based mechanism is active, underlying session will be terminated as well.

It's not absolutely critical but you are advised to plant the logout call in a route on your app's titular module in order to avoid cycling through the full module list.

## Custom authentication mechanism

If the two mechanisms provided are not suitable to your clients -- perhaps they prefer Basic, OpenID, or what have you -- you'd have to provide an implementation of `Suphle\Contracts\Auth\AuthStorage`, although you're more likely to extend `Suphle\Auth\Storage\BaseAuthStorage` so as to get some methods for free. In any case, the methods you want to pay closest attention to are:

```php
interface AuthStorage {

	public function startSession (string $userId):string;

	public function resumeSession ():void;
}
```

They are expected to interact with the actual mechanism and facilitate other user/authentication-based operations. The clear disparity in controlling session initialisation and resumption allows us easily implement exotic functionality such as updating user login status while retaining their login date, single sign on, etc.

## Testing authentication

Within test environment, we'll want to simulate the authentication states to examine our software's behavior in those states. For this purpose, Suphle provides the trait
`Suphle\Testing\Proxies\SecureUserAssertions`, applicable on all the [test types](/docs/v2/testing), although you're more likely to use them on module-level tests only since they interact with the database. The trait contains utilities for a streamlined experience working with the authentication mechanisms:

```php

protected function getAuthStorage (?string $storageName = null):AuthStorage
```

When called without an argument, it returns the default bound mechanism. If we're manually testing a mechanism different from that which was bound, it'll properly boot it for you before returning an instance.

```php

protected function actingAs (UserContract $user, string $storageName = null):string
```

It would make more sense to use this on tests with HTTP capabilities (e.g. `Suphle\Testing\TestTypes\ModuleLevelTest`). You want to call it before sending the request, like so,

```php

public function test_cant_resume_auth_session_after_logout () {

	$user = $this->replicator->getRandomEntity();

	$this->actingAs($user); // given

	$responseAsserter = $this->get("/segment"); // when

	// then, verify desired behavior for this user
}
```

When the `storageName` argument is provided, it will replace whatever mechanism was bound since it doesn't make sense for developer to authenticate to one mechanism while app is running on another.

The call to `actingAs` should come before any subsequent session related functions since it restarts underlying session. An example is when combined with a HTTP test sending a CSRF token. The correct way to do that would be:

```php

public function test_authorized_user_can_perform_operation () {

	$this->actingAs($this->lastInserted->employer->user); // given

	$csrfToken = $this->getContainer()->getClass(CsrfGenerator::class)
	->newToken();

	$this->putJson( // when

		$urlPattern . $this->lastInserted->id,

		array_merge($this->updatePayload, [

			CsrfGenerator::TOKEN_FIELD => $csrfToken
		])
	);

	// then
}
```

`actingAs` returns a string, which is crucial for token-based tests that require a token with which to make subsequent authenticated requests.

```php

protected function assertGuest (string $storageName = null):self
```

This is a verification method useful for actions expected to not contain an authenticated user afterwards.

```php

protected function assertAuthenticatedAs (UserContract $expectedUser, string $storageName = null):self
```

This is the inverse verification for `assertGuest()`.