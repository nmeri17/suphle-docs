## Introduction

I/O consists of peripheral components typically not governed by domain logic. They typically serve to facilitate efficient meeting of business goals and by their configuration, exist at the infrastructural layer of our application.

## Sessions

Sessions allows the application retain the identity of its visitors in-between requests. Often times, developers push various things into the session as it's more convenient to work with than asking their front-end counterpart to include the target field. The problems sessions are fraught with should cause them to be used sparingly:

- Session contents are not immediately apparent when auditing a failed request -- the payload is.

- Session usage can introduce some bugs very hard to decipher. The infamous code 419 quickly comes to mind.

- It makes web request endpoints not inter-operable within stateless API environments.

For these reasons, only data too sensitive to participate in the payload and too random or temporary to fit on a database column should be pushed into the session super-global.

Suphle provides an interface, `Suphle\Contracts\IO\Session`, for wrapping this super-global, in order to erase any friction that may arise from accessing it between live and test environments.

```php

interface Session {
		
	public function setValue (string $key, $value):void;

	public function getValue (string $key);

	public function hasKey (string $key):bool;

	public function reset ():void;

	public function startNew ():void;

	public function setFlashValue (string $key, $value):void;
}
```

Default implementation of `Session` connected uses a file-based handler. Thus, if you'll prefer to replace this handler, available options are to either override the `Session::startNew` method with an implementation that adequately calls the native `session_set_save_handler` function, or write an adapter for a 3rd-party library dedicated to this purpose.

This object is booted and managed automatically by `Suphle\Auth\Repositories\BrowserAuthRepo` at the authentication layer. The implication of this is that:

1. Its contents will be empty at routes bound to the `TokenStorage` [authentication mechanism](/docs/v1/routing#authentication). This is expected behavior as only browsers send cookies and as such, are capable of session retention.

1. Methods to be interacted with on this interface depend on how low-level your needs are. For trivial cases, only `setValue`, `getValue`, `hasKey`, `setFlashValue` should be useful to you. Data entered through the `setFlashValue` method will automatically be wiped on the subsequent request.

### Starting a new session

The `startNew` method equally happens to be the location where session lifespan is read and set. In the `.env` file accompanying module installations, the `SESSION_DURATION` entry is set to the number of seconds of a day and incrementally applies to all sessions started from the origin. If this timeframe doesn't suit you, set it to one more preferable in the `.env`.

The only time tampering with session lifetimes from a `Session` implementation is warranted is for software where different user roles can have different durations, in which case, you'll have to supply a custom method that sends a custom cookie with a timeframe that corresponds to that user category.

```php

use Suphle\Adapters\Session\NativeSession;

use Suphle\Contracts\Auth\UserContract;

class CustomSessionAccessor extends NativeSession {

	const ROLES_TO_DURATION = [

		UserContract::FRONT_DESK => "FRONT_DESK_SESSION",

		UserContract::EXECUTIVE => "EXECUTIVE_SESSION",

		UserContract::REGULAR => "DEFAULT_SESSION"
	];

	public function setCategoryTimeframe (UserContract $user) {

		$this->setCookieElapse(
			$this->envAccessor->getField(

				self::ROLES_TO_DURATION[$user->getRole()]
			)
		);
	}
}
```

Because session resumption supercedes user hydration, this method can only be invoked after the authentication process is successful i.e. as soon as an authenticated user is available.

```php

use Suphle\Auth\{Repositories\BrowserAuthRepo, Storage\SessionStorage};

use Suphle\Contracts\{Auth\ColumnPayloadComparer, IO\Session};

class CustomBrowserAuthRepo extends BrowserAuthRepo {

	public function __construct (
		protected readonly ColumnPayloadComparer $comparer,

		protected readonly SessionStorage $authStorage,

		protected readonly Session $sessionContract
	) { 
		
		//
	}

	public function successLogin () {

		$user = $this->comparer->getUser();

		$this->authStorage->startSession($user->getId());

		$this->sessionContract->setCategoryTimeframe($user);
	}
}
```

## Caching

## Mailing