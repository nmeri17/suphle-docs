## Introduction

This chapter covers exercises at the outskirts of our application. It's one of the meta chapters existing in part for academic rather than practical purposes. First, we will be looking at ways in which the program can be exposed to expected visitors. Then we'll look at activities ran before HTTP server boots up and how to customize this.

## Exposing your software

After exposure, any number of users can surf our application by entering URLs leading to the patterns defined in our route collections in their browsers. Below, we'll look at the available mediums for exposing a Suphle web program.

### Using traditional servers

This method is both the easiest and the one you're probably used to. What's a PHP application without a good old `index.php` front controller? This method is all about pointing your Nginx or Apache config to Suphle's `index.php`. This file, along with its complimentary `.htaccess` config are already provided in your default Suphle installation. If you're using Nginx or any other server type, consider updating this documentation with the link to a gist containing generic parts of your config.

You may benchmark all methods for whichever is faster for you. You may also not have the luxury of running custom commands on your hosting provider. If it turns out that another method is more suitable for your use case, you may want to delete those files as they would then be redundant. No additional work is required. There's no difference in how your applications look or additional APIs available per se.

### Using long-running servers

Among the array of options available in PHP currently for this purpose, only a Roadrunner adapter is implemented both because it doesn't require the extension barrier of entry and because of the vast amount of features its components provide.

We use the `server:start` command with the following signature:

```bash

php suphle server:start AllModules
```

A server configuration is created for you containing some sensible defaults. This file is called `dev-rr.yaml` and stored on the project's root. If you would rather name it something else or have a different project structure, the path to your new config should be passed using the `rr_config_path` option.

```bash

php suphle server:start AllModules --rr_config_path="/absolute/path/to/dev-rr.yaml"
```

It's worth mentioning that the `server:start` command is advisable for use from production environments and rarely in development mode. Developers should always debug their back-ends from an automated test on the terminal. There are more than enough facilities in Suphle to assist in programmatically verifying any form of expectation.

#### Startup operations

Before the server builds, it performs a series of checks against the codebase behind the published modules. Should violations be spotted, this *compilation* phase, unfortunately, will fail.

##### Dependency checks

These checks are dependency-based filtrations. The following filters are currently in place:

- [Service-coordinator](/docs/v1/service-coordinators#Permitted-dependencies) restrictions. The reasoning behind each limitation is commented in the relevant filter.

- [Service class](/docs/v1/service-coordinators#Pure-services) restrictions.

- [Mailable](/docs/v1/io#mailing) restrictions.

##### Static type checks

Even though PHP has a type-system, its interpreted nature means that code whose usage conflicts with either its typed definition or the language's syntax, must be evaluated before they can be spotted and corrected. This would either imply writing tests to arbitrarily execute paths in our code, or distract us by writing language-level tests instead of verifying the acccuracy of our business logic.

Fortunately, a handful tools devoted toward evaluating your code without executing it (inadvertently triggering the business logic they implement), have sprung up over the years. Intermediate and senior developers often integrate these tooling into their project's build pipeline or rely on their IDE to detect and report potential type errors. Since these solutions are either team or tool dependent, they are easy to escape the Junior developer's radar, who will usually be most concerned with running his code as is.

For this reason, Suphle bundles static type-checking into its server setup phase. It uses [Psalm](https://psalm.dev) for this since it allows us automate violation correction. If an error is caught during this scan, server build will be terminated and the details of the error flushed to the terminal. An error is any body of code that executing will disrupt or crash the request or program.

```php

class ContainsError {

	public function echoTypo ():void {

		$animal = "cat";

		echo $amimal;
	}
}
```

If the interpreter encounters a class such as the one defined above, it will result in an error. So the job of the static-type checker is to report it beforehand.

After all errors are corrected, Psalm will incrementally suggest stricter validation rules to judge compliance by, but since they won't outright crash the program, such suggestions won't interrupt your Suphle server build. However, we will attempt to fix the suggestions for you automatically. If you don't appreciate the assistance, automatic fixes can be disabled by passing the `no_static_refactor` modifier to the server start command:

```bash

php suphle server:start AllModules --no_static_refactor
```

Passing this flag will merely scan the code and report its findings. The project's maintainer is expected to correct any errors by other means, for example, manually.

For it to function properly, Psalm anticipates the presence of a `psalm.xml` configuration schema. Among [other settings](https://psalm.dev/docs/running_psalm/configuration/), this file determines what severity level will be used in judging type-correctness. Your installation contains a default configuration that you are free to update its fields to customize its behavior i.e. it won't be overwritten in-between runs.

##### Custom startup operations

Additional operations unique to your use-case can be prepended to this phase. Such operations will include activities like architectural rule re-enforcements or anything else you need to certify project state before it's safe to bootstrap the HTTP server. Operations wishing to be part of this process must reside in a class implementing `Suphle\Contracts\Server\OnStartup`. This class will then be fed to the startup command.

```bash

php suphle server:start AllModules --operations_class="\AllModules\ModuleOne\Meta\BootOperations" --custom_operations_options="\AllModules\ModuleOne\Services\SkipFilter"
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

The rule above will cause every class found in the scanned path (your `AllModules`) to reach the handler, with the exception of `SkipFilter`. This condition is not necessary for all handlers. You are more likely to use the `Suphle\Hydration\Structures\ObjectDetails` class to reduce the list of classes to those extending a target entity.

The `OnlyLoadedByHandler` handler uses the first argument to specify what entity this rule is for and restrict classes capable of depending on it to entities given in the 2nd argument. In this case, `MailBuilder`s cannot be loaded/injected by any other classes except a `Task`.

`custom_operations_options` (or its shorthand, `c`) is a repeatable, optional command argument for sending values to the boot operations class.

```bash

php suphle server:start AllModules -o="\AllModules\ModuleOne\Meta\BootOperations" -c="\AllModules\ModuleOne\Services\SkipFilter" -c="\AllModules\ModuleOne\Services\AnotherSkip"
```

When the list of operations exceeds one and the number of values passed to the class become difficult to deserialize for each individual command, they may have to be extracted into independent commands eventually wrapping the base `server:start` command.

#### Server storage

This refers to ways in which ubiquitous data can be stored on the application server. The tradeoff here is that you become responsible for cache invalidation. Irrespective of the presence of [Flows](/docs/v1/flows), you ought to take advantage of all other opportunities optimization presents itself. From [caching](/docs/v1/io#caching) the result of static queries such as generic form drop-downs, to storing data in-memory in-between requests.

This is one of the major advantages of a long-running server over the traditional ones -- data can be shared in-between requests originating from different users. The challenge with leveraging this is that Suphle will evict all classes used to handle a request to avoid its state from interferring with another request to the application. In order to forestall this on a class where data seeking longevity has been saved, the data can either be stored on a static property, or the class [should implement](/docs/v1/container#Stickying-objects) `Suphle\Contracts\Hydration\ClassHydrationBehavior`.

Be careful not to implement this on a class that better exists in fresh state per request e.g. a Coordinator.

## Testing application server

With all the bootstrap operations that come with an application server build, a pertinent safety measure is for us to automate verification that necessary conditions are being met. This is carried out with an assertion against the `Suphle\Testing\Utilities\PingHttpServer::assertServerBuilds` trait. It will execute the binary at the project's root path using the server's configuration YAML file, with identical options used in setting up a bootstrapped application server.

Since it's a nominal assertion that rarely requires customization, it's created in the `Tests\Exceptions\ServerBuildTest` test class that accompanies default module templates. The class contains the following test case:

```php

public function test_server_builds_successfully () {

	$this->assertServerBuilds();
}
```

`PingHttpServer::assertServerBuilds` takes optional arguments for:

1. Passing additional options to the server command. This accepts flags that are passed to the `suphle` binary from the CLI. The default flags used are the generic ones recommended above for starting the server. They can be overridden by passing an array keyed by flag name and value. As with all strings, it's more reliable to access them through constants than literals. For server starting, the flags are represented by constants on the `Suphle\Server\Commands\HttpServerCommand` command. Do override/mute some of the flags with caution, or at least, ensure they match what the server is actually started with, as their disparity defeats the whole purpose of confirming server builds successfully.

```php

public function test_server_builds_successfully () {

	$this->assertServerBuilds([

		HttpServerCommand::MODULES_FOLDER_ARGUMENT => "Modules"
	]);
}
```

1. This argument should be used for directing the asserter to find the `suphle` binary at an alternate path; helpful for projects following a non-conventional structure where the titular module's root path doesn't correspond to binary location.