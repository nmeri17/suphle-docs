## Introduction

This chapter refers to the practise of user login and determining whether the viewer of a content is a registered one or a guest. This is a more widespread requirement across software in general than the specifics of how the users got in there i.e. registration. For this reason, along with the facts that it doesn't directly impact the Framework, it may be more suitable to publish the kitchen sink of security management as its own [Component](/docs/v1/component-templates).

Be that as it may, the login routes are the only ones the Framework is aware of. Suphle spins through all user-defined routes, any [Flow](/docs/v1/flows) route available, before checking whether the request matches defined login paths. This is advantegeous since we want to avoid hydrating and evaluating processes unnecessary for each request.

The overall overview of the login flow is as you might expect: check for matching paths, compare incoming credentials with existing, attach relevant authentication mechanism to authenticated user, send appropriate response.

## Login paths

These are defined in `Suphle\Contracts\Config\AuthContract::getLoginPaths()` config method. You typically want to extend `Suphle\Config\Auth` if at all you want to [replace it](/docs/v1/config), as it is already connected as default.

```php
namespace Suphle\Config;

use Suphle\Contracts\Config\AuthContract;

use Suphle\Auth\Renderers\{BrowserLoginMediator, ApiLoginMediator};

class Auth implements AuthContract {

	protected function getLoginPaths ():array {

		return [
			$this->markupRedirect() => BrowserLoginMediator::class,

			"api/v1/login" => ApiLoginMediator::class
		];
	}

	public function markupRedirect ():string {

		return "login";
	}
}
```

The array is keyed by desired login paths, which will eventually be compared against incoming request. Matching requests are then forwarded to login renderers. You can define as many login paths as necessary for your application. However, note that paths defined here are automatically designated to the `POST` HTTP method. You are free to connect the UI and `GET` pattern in their regular layers.

## Login mediators

These are an intermediary between login paths, computing authentication status and the renderer from which response will be derived. They are required to implement `Suphle\Contracts\Auth\LoginFlowMediator`. On the default config, some renderers are already defined-- we have `Suphle\Auth\Renderers\BrowserLoginMediator` and `Suphle\Auth\Renderers\ApiLoginMediator`.

`BrowserLoginMediator`, which is intended to apply to HTML based responses, is the more interesting of the duo. When a login attempt fails, it reloads the page but when successful, it checks for an intended destination, using the default location, "/", when that is absent. To overwrite this location, override the `BrowserLoginMediator::successDestination` protected property in your extended renderer. You don't have to attach an intended destination manually. Whenever a protected path is unable to find an active user, Suphle throws a `Suphle\Exception\Explosives\Unauthenticated` exception, that is in turn [handled](/docs/v1/exceptions) by `Suphle\Exception\Diffusers\UnauthenticatedDiffuser`. This diffuser uses the failed authentication's mechanism to determine whether it's a HTML based route. When true, it redirects user to `Suphle\Contracts\Config\AuthContract::markupRedirect()` method defined above, along with the intended location tacked as a query, resulting a seamless login UX for web visitors.

The methods `successRenderer` and `failedRenderer` on `Suphle\Contracts\Auth\LoginFlowMediator` are used to provide what renderer will be presented to user based on the authentication attempt status. Should the defaults not suit your business requirements, you can as well override and connect them under your custom interface collection.

`Suphle\Auth\Renderers\ApiLoginMediator` is a simple class:

```php
use Suphle\Contracts\Auth\{LoginFlowMediator, LoginActions};

use Suphle\Contracts\Presentation\BaseRenderer;

use Suphle\Response\Format\Json;

use Suphle\Auth\Repositories\ApiAuthRepo;

class ApiLoginMediator implements LoginFlowMediator {

	public function __construct (protected readonly ApiAuthRepo $authService) {

		//
	}

	public function successRenderer ():BaseRenderer {

		return new Json( "successLogin");
	}

	public function failedRenderer ():BaseRenderer {

		return new Json( "failedLogin");
	}

	public function getLoginService ():LoginActions {

		return $this->authService;
	}
}
```
You may have observed that the renderers are not wrapped in any HTTP method using `_get`. As we hinted earlier, all routes on this level are designated as `POST`s.

The action handlers given to these renderers are expected to reside on the service returned by the `LoginFlowMediator::getLoginService` method.

## Login services

These are responsible for communicating with whatever medium we intend to extract users from and authenticate against. They can be considered as [coordinators](/docs/v1/service-coordinators) action methods, but for login requests. The same [validator-for-POST-request rule](/docs/v1/service-coordinators#Validating-incoming-requests) on regular coordinators apply to them.

Login services are classes that implement `Suphle\Contracts\Auth\LoginActions`.

Both default login mediators have complementary login services-- `Suphle\Auth\Repositories\BrowserAuthRepo`, and `Suphle\Auth\Repositories\ApiAuthRepo`. Each of them utilizes an identical identification technique but have a slight difference in their behavior on success: `BrowserAuthRepo` initializes a session for the authenticated user and outputs whatever renderer is given in `BrowserLoginMediator::successRenderer()`. `ApiAuthRepo` on the other hand, responds with a token to use in authenticating user during subsequent visits.

```php

namespace Suphle\Auth\Repositories;

use Suphle\Services\Decorators\ValidationRules;

class ApiAuthRepo extends BaseAuthRepo {

	#[ValidationRules([
		"email" => "required|email",

		"password" => "required|alpha_num|min:5"
	])]
	public function successLogin ():iterable {

		return [ "token" => $this->startSessionForCompared() ];
	}
}
```

Identical rules are used for validating requests to both login services, The rules are generic as they are intended to conform with the default  credential verifier. If you wish to replace it, do remember to update the rules as well.

### Credential verifiers

The average business will require a way to determine whether incoming credentials belong to an existing user. We usually employ the use of payload field names or database columns. A common trope is searching a user on the database matching the incoming email and comparing his hashed password with the incoming one.

Given its level of popularity, the default verification is resolved using an implementation of the process described. If your authentication needs exceed those stipulated by an email-password comparison, or assuming you want to emit an event that initiates some domain specific action, custom functionality can be provided through `Suphle\Contracts\Auth\LoginActions::compareCredentials()` method.

Both login services available inject an interface, `Suphle\Contracts\Auth\ColumnPayloadComparer`, for comparing input with existing data. Default implementation of this interface is `Suphle\Auth\EmailPasswordComparer`; a class which, as the name implies, compares email field on incoming payload to the email database column. You are free to bind custom login services that inject an appropriate comparer. The only important condition is that Suphle is informed through `Suphle\Contracts\Auth\LoginActions::compareCredentials()` whether or not authentication succeeded.

### Custom credential verifier

`EmailPasswordComparer` uses its `columnIdentifier` property to hydrate a user based on email fields. You can afford to extend it and set that property to any field of your choosing. When one field comparison is not sufficient, you can override the `EmailPasswordComparer::findMatchingUser` method.

```php

protected function findMatchingUser ():?UserContract {

	return $this->userHydrator->findAtLogin([

		"username" => $this->payloadStorage->getKey("username"),

		"other_field" => $this->payloadStorage->getKey("other_field")
	]);
}
```

If you're not interested in password comparisons at all, consider ditching `EmailPasswordComparer` altogether, using `UserHydrator` on your `Suphle\Contracts\Auth\ColumnPasswordComparer` implementation to obtain a user instance.

```php

public function compare ():bool {

	$user = $this->userHydrator->findAtLogin([

		"username" => $this->payloadStorage->getKey("username"),

		"otp" => $this->payloadStorage->getKey("otp")
	]);

	return !is_null($user);
}
```

`UserHydrator`s represent the underlying user storage. For a database-driven storage, the hydrator will rely on the active `Suphle\Contracts\Database\OrmDialect`, since the user it returns should conform to its model instance. The Eloquent implementation simply looks like this:

```php
namespace Suphle\Adapters\Orms\Eloquent;

use Suphle\Contracts\Auth\{UserContract, UserHydrator as HydratorContract};

class UserHydrator implements HydratorContract {

	/**
	 *  {@inheritdoc}
	*/
	public function findAtLogin (array $criteria):?UserContract {

		return $this->model->where($criteria)->first();
	}
}
```

It's at the database layer. You don't want to change it unless additional query clauses beyond simple fields are required for comparison.

That's all there is to the login flow. Deep customization may seem like a lot but what has been achieved is not muddling up responsibilities in a way that's going to make modification risky and a nightmare. We also have no god objects. It's flexible enough to authenticate and connect users from any source, any ORM, using clearly defined interfaces.

# Authentication in the application

The following sections cover how to protect our routes from unauthenticated access, how to retrieve an instance of the current user and how to impersonate users using privileged access.

## Securing routes

A number of authentication mechanisms are used in practise, depending on capabilities of the client device application is being built for. Suphle implements the two most common of these: session-based authentication and JWTs. As it relates to routing, when a developer protects a route using a certain mechanism, it can't be accessed using another mechanism since the defined mechanism can't translate incoming details into what it can understand. In a nutshell, route-based authentication refers to a predefined way to limit resource access from user requests unable to provide familiar credentials.

### Simple authentication tag

In Suphle, the `Suphle\Contracts\Auth\AuthStorage` interface is used to represent the mechanisms mentioned earlier, and must be implemented by each unique mechanism. Collections containing routes we wish to secure must bind those paths to the `Suphle\Auth\RequestScrutinizers\AuthenticateMetaFunnel` collector by overriding the `_preMiddleware` reserved method like so:

```php

use Suphle\Routing\{BaseCollection, PreMiddlewareRegistry, Decorators\HandlingCoordinator};

use Suphle\Auth\RequestScrutinizers\AuthenticateMetaFunnel;

use Suphle\Response\Format\Json;

use Suphle\Tests\Mocks\Modules\ModuleOne\Controllers\BaseCoordinator;

#[HandlingCoordinator(BaseCoordinator::class)]
class SecureBrowserCollection extends BaseCollection {

	public function SEGMENT() {

		$this->_httpGet(new Json("plainSegment"));
	}

	public function _preMiddleware (PreMiddlewareRegistry $registry):void {

		$registry->tagPatterns(

			new AuthenticateMetaFunnel(["SEGMENT"], $this->hydrateAuthStorage())
		);
	}
}
```

With the binding above, all requests to `http://example.com/segment` will require the user to be authenticated by the given authentication mechanism.

`Suphle\Routing\BaseCollection` injects `Suphle\Contracts\Auth\AuthStorage` into its constructor, which would lift whatever mechnism is set as default in `BaseInterfaceCollection`. If you have any reason to override your route collection's constructor, do well to provide a preferred authentication mechanism for your route authentication needs. The sub-class, `Suphle\Routing\BaseApiCollection` uses the more specific `Suphle\Auth\Storage\TokenStorage`

### Detaching in nested collections

As route patterns cascade, protection applied to a prefixed pattern or method applies to patterns in the collection below it. To selectively apply authentication to a sub-collection, those patterns to be exempted must be detached from the over-arching authentication lording over them. For example, given the following parent route collection:

```php

use Suphle\Routing\{BaseCollection, PreMiddlewareRegistry, Decorators\HandlingCoordinator};

use Suphle\Auth\RequestScrutinizers\AuthenticateMetaFunnel;

use Suphle\Tests\Mocks\Modules\ModuleOne\{Routes\Prefix\UnchainParentSecurity, Controllers\BaseCoordinator};

#[HandlingCoordinator(BaseCoordinator::class)]
class UpperCollection extends BaseCollection {

	public function _preMiddleware (PreMiddlewareRegistry $registry):void {

		$registry->tagPatterns(

			new AuthenticateMetaFunnel(["PREFIX"], $this->hydrateAuthStorage())
		);
	}
	
	public function PREFIX () {
		
		$this->_prefixFor(UnchainParentSecurity::class);
	}
}
```

If we want to open some patterns on `UnchainParentSecurity` to guest and authenticated users alike, we'll use the `PreMiddlewareRegistry::removeTag` method to disconnect them.

```php

use Suphle\Routing\{BaseCollection, PreMiddlewareRegistry, Decorators\HandlingCoordinator};

use Suphle\Response\Format\Json;

use Suphle\Tests\Mocks\Modules\ModuleOne\Controllers\MixedNestedSecuredController;

#[HandlingCoordinator(MixedNestedSecuredController::class)]
class UnchainParentSecurity extends BaseCollection {

	public function _preMiddleware (PreMiddlewareRegistry $registry):void {

		$registry->removeTag(

			["UNLINK"], AuthenticateMetaFunnel::class
		);
	}
	
	public function UNLINK () {
		
		$this->_httpGet(new Json("handleUnlinked"));
	}
	
	public function RETAIN__AUTHh () {
		
		$this->_httpGet(new Json("handleRetained"));
	}
}
```

Now, requests to `/prefix/unlink` will no longer discriminate against the authentication status of its visitor.

### Enforcing user verification

Often, it's not enough for visiting user to be authenticated, but for them to have verified their account using mediums such as email or phone number. In order to achieve this, a collector that evaluates user verification status must be bound after the one to `AuthenticateMetaFunnel`. A default one is provided for you, in the form of  `Suphle\Adapters\Orms\Eloquent\RequestScrutinizers\AccountVerifiedFunnel`.

```php

use Suphle\Routing\{BaseCollection, PreMiddlewareRegistry, Decorators\HandlingCoordinator};

use Suphle\Auth\RequestScrutinizers\AuthenticateMetaFunnel;

use Suphle\Response\Format\Json;

use Suphle\Adapters\Orms\Eloquent\RequestScrutinizers\AccountVerifiedFunnel;

use Suphle\Tests\Mocks\Modules\ModuleOne\Controllers\BaseCoordinator;

#[HandlingCoordinator(BaseCoordinator::class)]
class SecureBrowserCollection extends BaseCollection {

	public function SEGMENT() {

		$this->_httpGet(new Json("plainSegment"));
	}

	public function _preMiddleware (PreMiddlewareRegistry $registry):void {

		$patterns = ["SEGMENT"];

		$registry->tagPatterns(

			new AuthenticateMetaFunnel($patterns, $this->hydrateAuthStorage())
		)
		->tagPatterns(new AccountVerifiedFunnel($patterns) );
	}
}
```

`AccountVerifiedFunnel` accepts an optional 2nd argument for declaring what URL is necessary for commencing the verification process. The default value for this parameter is `/accounts/verify`. When the protected route pattern matches [the API prefix](/docs/v1/routing#API-channel-configuration), the visitor will receive a JSON message containing the verification destination, while those originating from the browser will be redirected to it.

The 3rd argument of this collector is used for optionally specifying what field determines account verification status. Majority applications use their database's `email_verified_at` column, thus this is the default value for that parameter. It can be set to any other field is more applicable in your case. However, if your account verification transcends the simplistic single column comparison, consider replacing this collector with a custom one that meets your needs. This collector must then be linked to its handler through the `Suphle\Contracts\Config\Router::scrutinizerHandlers` method.

```php

class RouterMock extends Router {

	/**
	 * {@inheritdoc}
	*/
	public function scrutinizerHandlers ():array {

		return array_merge(parent::scrutinizerHandlers(), [

			CustomVerifierFunnel::class => ComplexVerifierHandler::class
		]);
	}
}
```

Collector handlers are required to extend the `Suphle\Routing\Structures\BaseScrutinizerHandler` class.

```php

class ComplexVerifierHandler extends BaseScrutinizerHandler {

	public function scrutinizeRequest ():void {

		// some awesome verification
	}
}
```

### Authentication in mirrored collections

As you are already aware, routing [works a little differently](/docs/v1/routing#Route-mirroring) in Suphle -- collections rendering HTML content (implying a session-based authentication mechanism) can be mirrored to respond with JSON (and would naturally prefer a token-based mechanism). This presents a conundrum over which mechanism to prefer.

To aid us in resolving this challenge, we use the `Suphle\Contracts\Config\Router::mirrorAuthenticator()` method. When a mirrored request detects the presence of an authentication definition, it hydrates the class returned from this method and proceeds to use that to find an active session. The default config returns `Suphle\Auth\Storage\TokenStorage`.

The caveat to bear in mind while working with mirrored routes is that whatever mechanism is returned from this method must correspond with the one user was authenticated by during login. It is assumed that the user visiting a mirrored route must have authenticated himself with the mechanism given in `Suphle\Contracts\Config\Router::mirrorAuthenticator()`. The end user should be unaware of any mirroring in place; thus, one cannot login using a "/login" path making use of session mechanism and expect to access mirrored, secured routes where `mirrorAuthenticator()` returns `TokenStorage`. They should use "/api/v1/login", instead, which would provide them a token to authenticate themselves with.

## Retrieving user instance

During the course of development, the need to assign a unique resource pertaining to one user may arise, and we'll want to know what user is running that piece of functionality at the time. This can be achieved in different ways, depending on where we want to do this. Below, we will look at kinds of locations user can be requested from.

### During login flow

Within this procedure, you can only be sure of working with a valid user after `Suphle\Contracts\Auth\LoginActions::compareCredentials()` returns true. `Suphle\Contracts\Auth\ColumnPayloadComparer`, which exists on both login services under the `comparer` property, has a method `getUser()` that you would typically use either in `Suphle\Contracts\Auth\LoginActions::successLogin()` or any custom event handlers employed to avoid attracting business logic there.

If you're using your own comparer, you might as well provide a similar method for reading the user you confirmed is legitimate.

### Everywhere else

Wherever the container sees the type-hint `Suphle\Contracts\Auth\AuthStorage`, it'll either inject the default bound mechanism or the one used to authenticate a user if it's a secured route. The default binding is `Suphle\Auth\Storage\SessionStorage`, a session-based implementation that unless replaced, will be returned on routes without authentication. For obtaining users from the mechanism, `AuthStorage` defines the `getUser` method. It's only capable of returning `null` for unprotected routes where user presence is optional. Resources at such routes are intended for consumption by both authenticated and unauthenticated parties.

### Unique mechanism features

For whatever mechanism is active, there are one or two distinct features you'll want to be aware of. They both implement multi-user login -- a phenomenon applicable in hierarchial applications where it may be necessary for a privileged user to browse as one with lesser authorities -- but it's more pronounced under session-based authentication.

- `Suphle\Auth\Storage\TokenStorage`
This requires the presence of certain env variables. They are already defined in the .env file that comes with a fresh Suphle installation. Multi-user login is achieved by calling `Suphle\Contracts\Auth\AuthStorage::imitate(string $newIdentifier)`, rather than successive calls to logout and log back in. This mechanism will return a token for the given identifier. It is expected that the client will store the parent identifier and be responsible for reverting to it.

- `Suphle\Auth\Storage\SessionStorage`
This mechanism uses the same signature as above for impersonation purposes. However, the state of both active users are stored on the server. You would typically hide the route that triggers this functionality under an administrative [authorization](/docs/v1/authorization#Route-based-authorization).

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
`Suphle\Testing\Proxies\SecureUserAssertions`, applicable on all the [test types](/docs/v1/testing), although you're more likely to use them on module-level tests only since they interact with the database. The trait contains utilities for a streamlined experience working with the authentication mechanisms:

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