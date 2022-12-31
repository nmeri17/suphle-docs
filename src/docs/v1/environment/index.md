## Introduction

Parameters our application deals with at the I/O level differ from environment to environment. We don't want use the same mailing or payment credentials in production or testing environment, to avoid real life consequences such as triggering spam blockers or money deducted from our account. Such information should not be packaged along with the code but managed at the infrastructural layer. Each environment (development/test, stage, production), would receive applicable variables in a format depending on what manner the software is deployed with.

## Defining environment variables

Deployment methods may provide different shapes for describing parameters but all share the common property for key-value pairs. In Suphle, these parameters can be defined in a few ways:

### .env file

This is a file saved as ".env" in the root of each [module](/docs/v1/modules).

```env

PRIVATE_API_KEY = [redacted]
```

A default file containing fields mandatory for adequate functionality of your module is included with each module. It should be customized to suit personal values.

### Roadrunner env section

In the "dev-rr.yaml" roadrunner config included in your Suphle installation, there's section, server > env, where environment parameters can be defined.

```yaml

server:
  command: "php suphle-worker.php"
  env:
    - DATABASE_NAME: suphle
```

### PHPUnit variables

PHPUnit provides an "phpunit.xml" file for configuring how test evaluation behaves, PHP INI settings. Among other things, it allows us overwrite variables defined using the ".env" method just within the scope of our test.

```xml
<?xml version="1.0" encoding="UTF-8"?>

<phpunit
	colors = "true"
>
	<testsuites>
		<testsuite name="all_tests">
			<directory>./tests</directory>
		</testsuite>
	</testsuites>

	<php>
		<ini name="error_reporting" value="-1" />
		<env name="DATABASE_USER" value="nmeri" />
		<env name="DATABASE_PASS" value="password" />
		<env name="DATABASE_NAME" value="suphle_test" />
		<env name="DATABASE_HOST" value="127.0.0.1" />
	</php>
</phpunit>
```

The test command would have to include this configuration as part of its arguments for test runner to acknowledge the overrides.

```bash

# from vendor/bin
phpunit path/to/tests --configuration="path/to/phpunit.xml"
```

All environment definition methods are compatible with the .env format. When the application requests for a parameter's value, Suphle will read from all possible sources.

## Environment variables in the application

When type-hinted, the interface `Suphle\Contracts\IO\EnvAccessor` loads variables into memory. Some classes require it before execution gets to where you have access to/user-land, so loading will happen behind the scenes.

### Reading environment fields

Loaded fields can then be read within the application using the `getField` method:

```php

class ConfigDownloader extends BaseHttpRequest {

	public function __construct (

		ClientInterface $requestClient, DetectedExceptionManager $exceptionDetector,

		protected readonly EnvAccessor $envAccessor
	) {

		parent::__construct($requestClient, $exceptionDetector);
	}

	public function getRequestUrl ():string {

		return $this->envAccessor->getField(

			self::ENV_CONFIG_URL, "https://default-url"
		);
	}
}
```

### Validating environment fields

The 2nd argument to `EnvAccessor::getField` allows us define fallback values for missing variables. However, such optional defaults are not always possible to know beforehand. Such scenario is common while developing 3rd-party packages, and should force application to collapse until a value is provided.

This functionality is provided by the `Suphle\IO\Env\AbstractEnvLoader::validateFields` method. `AbstractEnvLoader` is an implementation of `EnvAccessor` that unifies calls to different sources for deriving environment variables. It defines a `client` property that points to the underlying `Dotenv\Dotenv` instance. This object enables library developers validate field values received using its `ifPresent` and `required` methods.

### Replacing default accessor

The default implementation for `EnvAccessor` is `Suphle\IO\Env\DatabaseEnvReader`. Customizations should extend it and [override its entry](/docs/v1/container#Binding-regular-interfaces) on `InterfaceCollection::simpleBinds`.

```php
class LibraryEnvReader extends DatabaseEnvReader {

	protected function validateFields ():void {

		parent::validateFields();

		$this->client->ifPresent(["PRIVATE_KEY"])->required();
	}
}
```