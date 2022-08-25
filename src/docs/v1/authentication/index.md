## Introduction

This chapter refers to the practise of user login and determining whether the viewer of a content is a registered one or a guest. This is a more widespread requirement across software in general than the specifics of how the users got in there i.e. registration. For this reason, along with the facts that it doesn't directly impact the Framework, it may be more suitable to publish the kitchen sink of security management as its own [Component](/docs/v1/component-templates).

Be that as it may, the login routes are the only ones the Framework is aware of. Suphle spins through all user-defined routes, any [Flow](/docs/v1/flows) route available, before checking whether the request matches defined login paths. This is advantegeous since we want to avoid hydrating and evaluating processes unnecessary for each request.

The overall overview of the login flow is as you might expect: check for matching paths, compare incoming credentials with existing, attach relevant authentication mechanism to authenticated user, send appropriate response.

## Login paths

These are defined in `Suphle\Contracts\Config\AuthContract::getLoginPaths` config. You typically want to extend `Suphle\Config\Auth` if at all you want to [replace it](/docs/v1/config), as it is already connected as default.

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

The array is keyed by desired login paths, which will eventually be compared against incoming request. Matching requests are then forwarded to login renderers. You can define as many login paths as necessary for your application. However, note that paths defined here are automatically designated to the POST HTTP method. You are free to connect the UI and GET pattern in their regular layers.

## Login mediators

These are an intermediary between login paths, computing authentication status and the renderer from which response will be derived. They are required to implement `Suphle\Contracts\Auth\LoginFlowMediator`. On the default config, some renderers are already defined-- we have `Suphle\Auth\Renderers\BrowserLoginMediator` and `Suphle\Auth\Renderers\ApiLoginMediator`.

`BrowserLoginMediator`, which is intended to apply to HTML based responses, is the more interesting of the duo. When a login attempt fails, it reloads the page but when successful, it checks for an intended destination, using the default location, "/", when that is absent. To overwrite this location, override the `BrowserLoginMediator::successDestination` protected property in your extended renderer. You don't have to attach an intended destination manually. Whenever a protected path is unable to find an active user, Suphle throws a `Suphle\Exception\Explosives\Unauthenticated` exception, that is in turn [handled](/docs/v1/exceptions) by `Suphle\Exception\Diffusers\UnauthenticatedDiffuser`. This diffuser uses the failed authentication's mechanism to determine whether it's a HTML based route. When true, it redirects user to `Suphle\Contracts\Config\AuthContract::markupRedirect` defined above, along with the intended location tacked as a query, causing a seamless login UX.

The methods `successRenderer` and `failedRenderer` on `Suphle\Contracts\Auth\LoginFlowMediator` are used to provide what renderer will be presented to user based on the authentication attempt status. Should the defaults not suit your business requirements, you can as well override and connect them under your custom interface collection.

`Suphle\Auth\Renderers\ApiLoginMediator` is a simple class:

```php
use Suphle\Contracts\Auth\{LoginFlowMediator, LoginActions};

use Suphle\Contracts\Presentation\BaseRenderer;

use Suphle\Response\Format\Json;

use Suphle\Auth\Repositories\ApiAuthRepo;

class ApiLoginMediator implements LoginFlowMediator {

	private $authService;

	public function __construct (ApiAuthRepo $authService) {

		$this->authService = $authService;
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
You may have observed that the renderers are not wrapped in any HTTP method using `_get`. As we hinted earlier, all routes on this level are designated as POSTs.

## Login services

These are responsible for communicating with whatever medium we intend to extract users from and authenticate against. They can be considered as [controller](/docs/v1/controllers) action methods but for login requests. The same [validator-for-POST-request rule](/docs/v1/controllers#validation) on regular controllers applies to them. Login services are classes that implement `Suphle\Contracts\Auth\LoginActions`.

Both default login mediators have complementary login services-- `Suphle\Auth\Repositories\BrowserAuthRepo`, and `Suphle\Auth\Repositories\ApiAuthRepo`. Each of them utilizes an identical identification technique but have a slight difference in their behavior on success; `BrowserAuthRepo` initializes a session for the authenticated user and outputs whatever renderer is given in `BrowserLoginMediator::successRenderer`. `ApiAuthRepo` on the other hand, responds with a token to use in authenticating user during subsequent visits.

```php
namespace Suphle\Auth\Repositories;

class ApiAuthRepo extends BaseAuthRepo {

	public function successLogin () {

		return [

			"token" => $this->authStorage->startSession($this->comparer->getUser()->getId())
		];
	}
}
```
Notice that methods on `Suphle\Contracts\Auth\LoginActions` correspond to those defined in our mediator renderers--controller actions.

All this while, we have looked at success methods and their failure counterparts. But how is Suphle able to decipher whether or not credentials received are accurate?

### Obtaining Login status

The average business will require a way to determine whether incoming credentials belong to an existing user. We usually employ the use of payload field names or database columns. A common trope is searching a user on the database matching the incoming email and comparing his hashed password with the incoming one. As you may have guessed, the default status is resolved using an implementation of the process described. If your authentication needs exceed those provided by an email-password comparison, or assuming you want to emit an event that initiates some domain specific action, custom functionality can be provided through `Suphle\Contracts\Auth\LoginActions::compareCredentials`.

Both login services available include a default implementation of the email-password paradigm using `Suphle\Auth\EmailPasswordComparer`.

```php{10}
namespace Suphle\Auth\Repositories;

use Suphle\Contracts\Auth\LoginActions;

abstract class BaseAuthRepo implements LoginActions {

	protected $comparer;

	public function compareCredentials ():bool {

		return $this->comparer->compare();
	}
}
```

```php{8}
namespace Suphle\Auth\Repositories;

use Suphle\Auth\Storage\TokenStorage;

use Suphle\Auth\EmailPasswordComparer;

class ApiAuthRepo extends BaseAuthRepo {

	private $authStorage;

	public function __construct (EmailPasswordComparer $comparer, TokenStorage $authStorage) { 
		
		$this->comparer = $comparer;

		$this->authStorage = $authStorage;
	}
}
```
If you're not interested in this paradigm at all, you are free to supply custom login services that inject an appropriate comparer. The only important factor is that Suphle is informed through `Suphle\Contracts\Auth\LoginActions::compareCredentials` whether or not authentication succeeded. If however, you want email-password but with additional bells and whistles, you can customize `EmailPasswordComparer` as follows.

### Extending `EmailPasswordComparer`

This comparer uses `Suphle\Contracts\Auth\UserHydrator::findAtLogin` to hydrate a user *specifically* relevant to the login process. `UserHydrator`s represent the underlying user storage. For a database-driven storage, the hydrator will rely on the active `Suphle\Contracts\Database\OrmDialect`, since the user it returns should conform to its model instance. From the Eloquent implementation, we can extract the following snippet:

```php
namespace Suphle\Adapters\Orms\Eloquent;

use Suphle\Contracts\Auth\{UserContract, UserHydrator as HydratorContract};

class UserHydrator implements HydratorContract {

	protected $loginColumnIdentifier = "email";

	/**
	 *  {@inheritdoc}
	*/
	public function findAtLogin ():?UserContract {

		return $this->model->where([

			$this->loginColumnIdentifier => $this->payloadStorage->getKey($this->loginColumnIdentifier)
		])->first();
	}
}
```
Depending on your needs, you can either update the `loginColumnIdentifier` property, or replace the `findAtLogin` method altogether.

### Login service Validation

As was stated earlier, `Suphle\Contracts\Auth\LoginActions` should be considered as controller actions--they are entitled to compulsory vaidators that must run before `Suphle\Contracts\Auth\LoginActions::compareCredentials`. This means we can confidently work with fields inside the comparer without the need to check for presence of fields.

The difference between login and validators you're [accustomed to](/docs/v1/controllers#validation) is that the method name for the former is being derived from the action method. Login only consists of one route, thus, only one valid rule-set is required. The validation rules are expected to reside at `Suphle\Contracts\Auth\LoginActions::successRules`. 

Both our login services are constrained by the following rules:

```php
namespace Suphle\Auth\Repositories;

use Suphle\Contracts\Auth\LoginActions;

abstract class BaseAuthRepo implements LoginActions {

	public function successRules ():array {

		return [
			"email" => "required|email",

			"password" => "required|alpha_num|min:5"
		];
	}
}
```

That's all there is to the login flow. Deep customization may seem like a lot but we have achieved is not muddling up responsibilities in a way that's going to make modification a nightmare. We also have no god objects. It's flexible enough to authenticate and connect users from any source, using clearly defined interfaces.

## Securing routes
Every collection can decide on what authentication mechanism it prefers to use. This is required since route collections are meant to be inter-operable between more than one channel i.e. web, api etc. While different routes utilising diverse mechanisms may seem impractical, the major advantage is for the fluid transition to other channels discussed under the [routing topic](/docs/v1/routing#route-inter-operability). During this process, the mechanism internally switches to that used by the active collection.

To secure regular routes, we need to include their pattern in this collection's list
///

Then, return the mechanism type for this collection
///

Note that whatever mechanism is returned must correspond with the one user was authenticated by while logging in. The caveat to bear in mind while working with mirrored routes is that it is assumed that the user visiting a mirrored route must have authenticated himself with the **current** mechanism i.e. only users who have logged in through the token channel can still access mirrored routes locked under the session channel, as long as their requests are accompanied with the authentication token they received.

## Retrieving user instance
This can be achieved in two different ways, depending on where the user is requested. Either way, an instance of `Suphle\Contracts\Auth\User` will be returned. Below, we will look at the two kinds of locations user can be requested from.

### During login flow
The user doesn't exist on `AuthStorage` during the login procedure but in subsequent requests with the active authentication criteria resolved. By default, the resolved user instance can be read from `Suphle\Auth\EmailPasswordComparer` which is accessible from the `comparer` property if you're making use of the default repositories mentioned in the [Customization section](/docs/v1/authentication#Customization).

### Everywhere else
Authenticated user can be resolved by the container by type-hinting the `AuthStorage` interface and calling its `getUser` method. By default, a session-based implementation is bound to the container to be returned on routes without authentication. Resources at such routes are intended for consumption by both authenticated and unauthenticated users. This binding can be changed by simply binding your `AuthStorage` of choice.

/// Example using a different provider rather than binding entity

Authenticated routes, on the other hand, will resolve using whatever mechanism was attached to either the route's collection or that of its ancestors

## Logging out
The framework can be instructed to invalidate current authenticated status by calling the `logout` method of the `AuthStorage` interface from any location. When session mechanism is active, it will be discarded and will no longer yield a `Suphle\Contracts\Auth\User` instance when invoked. For token-based authentication, only the latter action is performed.

You are encouraged to plant the logout-bearing module on the very first module in your apps module tree in order to avoid cycling through others down the stack

## Multi-user login
Talk about `impersonate` flow for both mechanisms. What happens when I logout in that mode? How do I switch between users?

* where we discuss session resumption
The clear disparity in controlling session initialisation and resumption allows us easily perform actions such as updating user login status while retaining their login date, or implementing single sign on.