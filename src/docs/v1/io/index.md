## Introduction

I/O consists of peripheral components not governed by domain logic. They typically serve to facilitate efficient meeting of business goals and by their configuration, exist at the infrastructural layer of our application.

In order to access any of the underlying mechanisms exposed by interfaces discussed in this chapter, all the consumer is required to do is to declare a dependency on it from its constructor. We mostly go into the detail of these interfaces, here, for the purpose of customization or providing alternative adapters for their underlying mechanisms.

## Sessions

Sessions allows the application retain the identity of its browser-based visitors in-between requests. Often times, developers push various things into the session as it's more convenient to work with than asking their front-end counterpart to include the target field. However, the problems sessions are fraught with should cause them to be used sparingly; to mention but a few:

- Session contents are not immediately apparent when auditing a failed request -- the payload is.

- Session usage can introduce some bugs very hard to decipher. The infamous code 419 quickly comes to mind.

- It makes web request endpoints not inter-operable within stateless API environments.

For these reasons, only data too sensitive to participate in the payload and too random or temporary to fit on a database column should be pushed into the `$_SESSION` super-global.

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

The `startNew` method equally happens to be the location where session lifespan is read and set. In the `.env` file accompanying module installations, the `SESSION_DURATION` entry is set to the number of seconds in a day, and incrementally applies to all sessions initiated by a successful browser-based login. If this timeframe doesn't suit you, set it to one more preferable in the `.env`.

The only time tampering with session lifetimes from a `Session` implementation is warranted is for software when it interacts with other objects. For instance, if we want different user roles to have different durations, we'll have to provide a method that sends a custom cookie with a timeframe that corresponds to that user category.

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

The term "caching", is broadly used to describe a process of saving data, once it's accessed, ahead of future visits, under the consideration that this storage location is a faster one to read from when compared to the original source. This section narrows its focus to a variant of caching that extradites data storage to a server independent of memory and the one running the application. This responsibility requires servers with characteristics such as high-throughput, etc.

The Suphle interface `Suphle\Contracts\IO\CacheManager` is a wrapper around whatever adapter powers the underlying server being used for caching.

```php

interface CacheManager {

	public function setupClient ():void;

	public function getItem (string $key, callable $storeOnAbsence = null);

	public function deleteItem (string $key);

	public function saveItem (string $key, $data):void;

	public function tagItem (string $tagName, $data):void;
}
```

What matters most while making use of this interface is ensuring that our server of choice is indeed running, and supplying its connection string to the `CacheManager`'s client. The adapter being connected by default uses the [Predis package](https://github.com/predis/predis) that expects to find a Redis connection running at the URL defined on the `REDIS_HOST` and `REDIS_PORT` `.env` entries.

```

REDIS_HOST = 127.0.0.1
REDIS_PORT = 6379
```

### Reading cached data

We use the `getItem` method to retrieve data stored by a preceding operation, perhaps during an initializing request. However, a second, optional parameter is provided, for more ergonomic use. Rather than checking data availability, deriving from a source on cache miss, and pushing the fresh data into the cache, the sourcing operation should be sent as 2nd argument.

```php

class BypassExpensive extends UpdatelessService {

	public function __construct(

		protected readonly CacheManager $cacheManager,

		protected readonly StocksReader $stocksReader
	) {

		//
	}

	public function retrieveDailyStocks ():SdkCollection {

		return $this->cacheManager->getItem("todays_stocks", function () {

			return $this->stocksReader->fetchForToday();
		});
	}
}
```

The `storeOnAbsence` parameter will throw an exception if given callback does not return a value to be saved.

### Replacing default cache adapter

Should you have the need to provide another adapter, instead of wrangling its configuration parameters within the adapter itself, the designated location for such assignment is on the `Suphle\Contracts\Config\CacheClient` config. The config used by the Redis adapter, for instance, has the following definition:

```php

use Suphle\Contracts\{Config\CacheClient, IO\EnvAccessor};

class DefaultCacheConfig implements CacheClient {

	public function __construct(protected readonly EnvAccessor $envAccessor) {

		//
	}

	public function getCredentials ():array {

		return [

			"scheme" => "tcp",

			"host" => $this->envAccessor->getField("REDIS_HOST"),

			"port" => $this->envAccessor->getField("REDIS_PORT")
		];
	}
}
```

The adapter must then be connected to the rest of the application, ideally through an [interface loader](/docs/v1/container#Interface-loaders).

## Mailing

The comprehensiveness of [Symfony's Mailer](https://github.com/symfony/mailer) gives it an edge over most alternatives that offer facilities for handling and building mails. However, to prevent vendor lock-in, as well as streamline consumption of mailable classes to implementations of `Suphle\Contracts\Queues\Task`, we thought it wise to provide the `Suphle\Contracts\IO\MailClient` interface to wrap over mailer adapters.

```php

interface MailClient {

	public function setDestination (string $destination):self;

	public function setSubject (string $subject):self;

	public function setText (string $text):self;

	public function setHtml (string $html):self;

	public function fireMail ():void;

	public function getNativeClient ();
}
```

You're not expected to pollute your `Task` implementation with mail composition logic, as it may be focused on other higher-level responsibilities. Thus, you may consider abstracting it away to the very simple `Suphle\IO\Mailing\MailBuilder` class. To illustrate this, we'll borrow the `MailBuildAlerter` used by the default [Shutdown alerter](/docs/v1/exceptions#Shutdown-alerters):

```php

use Suphle\IO\Mailing\MailBuilder;

use Suphle\Contracts\IO\{EnvAccessor, MailClient};

class MailBuildAlerter extends MailBuilder {

	public function __construct(

		protected readonly MailClient $mailClient,

		protected readonly EnvAccessor $envAccessor
	) {

		//
	}

	public function sendMessage ():void {

		$this->mailClient->setDestination(

			$this->envAccessor->getField("MAIL_SHUTDOWN_RECIPIENT")
		)
		->setSubject(

			$this->envAccessor->getField("MAIL_SHUTDOWN_SUBJECT")
		)
		->setText($this->payload)->fireMail();
	}
}
```

It is then this encapsulation, `MailBuildAlerter::sendMessage` that would be invoked from the consuming `Task`.

When dealing with mails, it's not rare for the message to include custom user data. These messages are almost always automated, either creating a dynamic template from WYSIWYG editor, or a static one. In any case, it's impossible to know the receipient's data at this point. The recommended way to go about this is to declare placeholders in the template that would subsequently be replaced by actual data shortly before sending.

```php

class DefaultersReminder extends MailBuilder {

	final const PERMITTED_PLACEHOLDERS = [

		"full_name", "account_number"
	];

	/**
	 * @var UserContract[]
	*/
	protected array $defaulters = [];

	public function setDefaulters (array $defaulters):self {

		$this->defaulters = $defaulters;

		return $this;
	}

	public function sendMessage ():void {

		$template = $this->fetchDefaultersTemplate();
	
		foreach ($this->defaulters as $defaulter) {

			$this->mailClient->setDestination($defaulter->email)

			->setSubject(

				$this->envAccessor->getField("DEFAULTER_MAIL_SUBJECT")
			)
			->setText(
			
				$this->replaceTemplatePlaceholders($template, $defaulter)
			)->fireMail();
		}
	}

	protected function replaceTemplatePlaceholders (string $template, UserContract $defaulter):string {

		foreach (self::PERMITTED_PLACEHOLDERS as $columnName) {

			$template = str_replace(

				"{{$columnName}}", $defaulter->$columnName, $template
			);
		}

		return $template;
	}
}
```
