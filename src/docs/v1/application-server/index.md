## Introduction

This chapter covers exercises at the outskirts of our application. It's one of the meta chapters existing in part for academic rather than practical purposes. First, we will be looking at ways in which the program can be exposed to expected visitors. Then we'll look at activities ran before HTTP server boots up and how to customize this.

## Exposing your software

After exposure, any number of users can surf our application by entering URLs leading to the patterns defined in our route collections in their browsers. In the [very first chapter](/docs/v1/quick-start), we ignited a long-running Roadrunner server using the `project:create_new` command. Although this exposure type is recommended, it's not always preferrable. Below, we'll look at the available mediums for exposing a Suphle web program.

### Using traditional servers

This method is both the easiest and the one you're probably used to. What's a PHP application without a good old `index.php` front controller? This method is all about pointing your Nginx or Apache config to Suphle's `index.php`. This file, along with its complimentary `.htaccess` config are already provided in your default Suphle installation. If you're using Nginx or any other server type, consider updating this documentation with the link to a gist containing generic parts of your config.

You may benchmark all methods for whichever is faster for you. You may also not have the luxury of running custom commands on your hosting provider. If it turns out that another method is more suitable for your use case, you may want to delete those files as they would then be redundant. No additional work is required. There's no difference in how your applications look or additional APIs available per se.

### Using long-running servers

Among the array of options available in PHP currently for this purpose, only a Roadrunner adapter is implemented both because it doesn't require the extension barrier of entry and because of the vast amount of features its components provide.

The `project:create_new` is for kick-starting new projects and shouldn't be used for launching a server. Instead, the `server:start` command is more suitable for this purpose while deploying the software. Its mandatory signature is simple:

```bash

php suphle server:start
```

It relies on the presence of a default `rr.yaml` accompanying your Roadrunner installation in the vendor/bin folder. Unfortunately, this config doesn't point to your [published modules](/docs/v1/modules). To rectify this shortcoming, you can either configure it to do so, or point the binary to your published modules. To do this, we'll make a minor adjustment to our start command as follows:

```bash

php suphle server:start --rr_config_path="/absolute/path/to/dev-rr.yaml"
```

Our `dev-rr.yaml` contains some sensible defaults to get you started. It's worth mentioning that this command is advisable for use from production environments and rarely in development mode. Developers should always debug their back-ends from an automated test on the terminal. There are more than enough facilities in Suphle to assist in programmatically verifying any form of expectation.

#### Startup operations

Before the server builds, it performs a series of checks against the codebase behind the published modules. Should violations be spotted, this *compilation* phase, unfortunately, will fail. These checks are dependency based filtrations. The following filters are currently in place:

- [Service-coordinator](/docs/v1/service-coordinators#Permitted-dependencies) restrictions. The reasoning behind each limitation is commented in the relevant filter.

- [Service class](/docs/v1/service-coordinators#Pure-services) restrictions.

- [Mailable](/docs/v1/io#mailing) restrictions.

##### Custom startup operations

Additional operations unique to your use-case can be prepended to this phase. Such operations will include activities like architectural rule re-enforcements, static type checks, running tests, etc. Operations wishing to be part of this process must reside in a class implementing `Suphle\Contracts\Server\OnStartup`. This class will then be fed to the startup command.

```bash

php suphle server:start --operations_class="\AllModules\ModuleOne\Meta\BootOperations" --custom_operations_options="\AllModules\ModuleOne\Services\SkipFilter"
```

```php

namespace AllModules\ModuleOne\Meta;

use Suphle\Contracts\Server\OnStartup;

class BootOperations implements OnStartup {

	public function runOperations (string $executionPath, array $commandOptions):void {

		//
	}
}
```

Any collaborator required to achieve your aims will be hydrated if they're type-hinted in the constructor. One collaborator that will come in handy for defining architectural constraints is the `Suphle\Server\DependencySanitizer` class. Its `addRule` method has the following signature:

```php

public function addRule (string $ruleHandler, callable $filter, array $argumentList):void;
```

The `ruleHandler` is the class where the actual logic is expected to be performed. Classes failing rules in the handler should throw an error to signify termination. Handlers must implement the `Suphle\Contracts\Server\DependencyFileHandler` interface.

```php

interface DependencyFileHandler {

	public function evaluateClass (string $className):void;

	public function setRunArguments (array $argumentList):void;
}
```

However, you will benefit more by extending the `Suphle\Services\DependencyRules\BaseDependencyHandler` class since that contains a number of methods you will find helpful.

The `filter` callback will receive every class found under the given paths and should return true if the class should be fed to `DependencyFileHandler::evaluateClass`.

`argumentList` is where we specify variables to be fed to the handler.

To see it all together, let's refactor a toned-down version of the Mailable filter into our `BootOperations` class created above.

```php

namespace AllModules\ModuleOne\Meta;

use Suphle\Contracts\Server\OnStartup;

use Suphle\Server\DependencySanitizer;

class BootOperations implements OnStartup {

	public function __construct (protected readonly DependencySanitizer $sanitizer) {

		//
	}

	public function runOperations (string $executionPath, array $commandOptions):void {

		$this->sanitizer->setExecutionPath($executionPath);

		$this->sanitizer->addRule(
			OnlyLoadedByHandler::class,

			function ($className) use ($commandOptions):bool {

				return !in_array($className, $commandOptions);
			},

			[MailBuilder::class, [Task::class]]
		);

		$this->sanitizer->cleanseConsumers();
	}
}
```

The rule above will cause every class found to reach the handler, with the exception of `SkipFilter`. This condition is not necessary for all handlers. You are more likely to use the `Suphle\Hydration\Structures\ObjectDetails` class to reduce the list of classes to those extending a target entity.

The `OnlyLoadedByHandler` handler uses the first argument to specify what entity this rule is for and restrict classes capable of depending on it to entities given in the 2nd argument. In this case, `MailBuilder`s cannot be loaded/injected by any other classes except a `Task`.

`custom_operations_options` (or its shorthand, `c`) is a repeatable, optional command argument for sending values to the boot operations class.

```bash

php suphle server:start -o="\AllModules\ModuleOne\Meta\BootOperations" -c="\AllModules\ModuleOne\Services\SkipFilter" -c="\AllModules\ModuleOne\Services\AnotherSkip"
```

When the list of operations exceeds one and the number of values passed to the class become difficult to deserialize for each individual command, they may have to be extracted into independent commands eventually wrapping the base `server:start` command.

#### Server storage

This refers to ways in which ubiquitous data can be stored on the application server. The tradeoff here is that you become responsible for cache invalidation. Irrespective of the presence of [Flows](/docs/v1/flows), you ought to take advantage of all other opportunities optimization presents itself. From [caching](/docs/v1/io#caching) the result of static queries such as generic form drop-downs, to storing data in-memory in-between requests.

This is one of the major advantages of a long-running server over the traditional ones -- data can be shared in-between requests originating from different users. The challenge with leveraging this is that Suphle will evict all classes used to handle a request to avoid its state from interferring with another request to the application. In order to forestall this on a class where data seeking longevity has been saved, the data can either be stored on a static property, or the class [should implement](/docs/v1/container#Stickying-objects) `Suphle\Contracts\Hydration\ClassHydrationBehavior`.

Be careful not to implement this on a class that better exists in fresh state per request e.g. a coordinator.