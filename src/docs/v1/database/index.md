## Introduction

The database layer can be considered as the heart of your program. It's where we describe nouns or entities that drive the application. If you visualize your software, picture this layer residing on the outskirts of the application, independent of the [modules](/docs/v1/modules), and are all accessible to each other.

An object relational mapper, though not absolutely crucial, is often used to abstract away rows and functionality from the walls of the database server, into strongly-typed objects. PHP happens to be furnished with some established ORM libraries (not limited to [Eloquent](laravel.com/docs/8.x/eloquent) and [Cycle ORM](cycle-orm.dev)), with vast coverage of most possible database needs. Suphle keeps an open mind regarding your choice of which to use. If you are at a loss and could use some recommendation, do read on. Otherwise, skip the next section.

## Choosing an ORM

### Active Record pattern

Relatively static applications may be content with using an ORM that supports this pattern. Eloquent, mentioned above, is a powerful implementation that can serve. However, some believe this pattern to be plagued by an inherent design flaw that can make code maintenance a nightmare. 

When using this pattern, the models will expect a database connection to have been established for them. Consuming modules should endeavor to do this as early as possible.

```php

use Suphle\Contracts\Database\OrmDialect;

use Suphle\Tests\Mocks\Interactions\ModuleOne;

class ModuleOneDescriptor extends ModuleDescriptor {

	public function exportsImplements():string {

		return ModuleOne::class;
	}

	protected function registerConcreteBindings ():void {

		parent::registerConcreteBindings();

		$this->container->getClass(OrmDialect::class);
	}
}
```

In order to combat the typing problem and avoid magical pitfalls associated with this pattern, your software may benefit more from using Data Mappers. This is where an adaptation such as Cycle ORM starts to shine.

### DDD pattern

This pattern is yet to be explored in Suphle. Thus, no informed recommendation can be made. This is most evident in the following assumptions that are adjacent to DDD principles:

1. Our models are anemic
1. Chances of replacing our ORM in future are next to none

Whichever direction is most suitable for your application, it is recommended that as much as is possible, access to each model/entity is restricted to its managing module and its services.

## ORM adapters

In order to unify working with the ORM choices available, Suphle provides a few contracts for them to be defined by, grouped under the `Suphle\Contracts\Database` namespace. [So far](github.com/nmeri17/suphle/issues/20), only an Eloquent adapter has been written. As such, the rest of this chapter will refer to it as de-facto underlying client.

### Eloquent models

Majority of your interaction with an ORM will be done against methods on its parent model. This adapter offers a class that makes some slight adjustments in order to checkmate dangerous practises such as:

- Models not having factories or migrations
- Indiscriminate access to model instances using facades

This class is known as `Suphle\Adapters\Orms\Eloquent\Models\BaseModel` and all models are expected to extend it. Specifics regarding factories are described in greater detail on [their documentation page](laravel.com/docs/8.x/database-testing#defining-model-factories), although you may want to look at off the shelf [solutions at automating](github.com/mpociot/laravel-test-factory-helper) this task.

In order to encourage a feature-based, incremental approach toward development, models are required to list all migrations pertaining to them, using the `BaseModel::migrationFolders` method.

```php

use Suphle\Adapters\Orms\Eloquent\Models\{BaseModel, User};

class Employer extends BaseModel {

	// define relationships

	protected static function newFactory ():Factory {

		return EmployerFactory::new();
	}

	public static function migrationFolders ():array {

		return array_merge(
			[__DIR__ . DIRECTORY_SEPARATOR . "Migrations"],

			User::migrationFolders()
		);
	}
}
```

While testing `Employer`, the test runner will scan specified directories in an attempt to boot the database to a state relevant for the feature under test. Outside a test environment, migrations can still be run by interfacing with the Artisan CLI.

```bash

php suphle bridge:laravel make:migration create_employers_table
```

Additionally, you may sprinkle the `path` option to conform with your directory structure.

## Testing the data layer

Database testing is not restricted to a single test-type. However, classes wishing to test models must signify this beforehand in order for the test runner to setup and clean-up seeded data in-between tests. The relevant trait for this purpose is `Suphle\Testing\Condiments\BaseDatabasePopulator`. Functionality exposed on this trait is agnostic to whatever adapter is used under the hood.

### Declaring test model

Most significant in `BaseDatabasePopulator`s signature is an abstract method `getActiveEntity`.

```php

use Suphle\Testing\{TestTypes\IsolatedComponentTest, Condiments\BaseDatabasePopulator;

class EmploymentServiceTest extends IsolatedComponentTest {

	use BaseDatabasePopulator;

	protected function getActiveEntity ():string {

		return Employment::class;
	}
}
```

The amount of seeders ran is 10 but can be modified by returning a more appropriate figure from the `BaseDatabasePopulator::getInitialCount` method.

```php

class EmploymentServiceTest extends IsolatedComponentTest {

	use BaseDatabasePopulator;

	protected function getInitialCount ():int {

		return 200;
	}
}
```

These entities will be then be recycled for each test on the test class.

### Database state in-between resets

Whenever a URL change occurs, the container is ridded of all objects that interact with URL states. One of these objects is the Eloquent ORM adapter since it relies on its framework, which requires knowing current URL for possible route handling delegation.

For each test, associated migrations are ran and data is seeded even before your test method runs. But if a request is sent within the test, connection used for migration and seeding is being reset. When this occurs, subsequent database calls would see an empty database. In order to avoid this, we'll use the `preDatabaseFreeze` hook for all insertions expected to survive in-between connection resets:

```php
	class EmploymentServiceTest extends IsolatedComponentTest {

		use BaseDatabasePopulator;

		protected function preDatabaseFreeze ():void {

			$this->replicator->modifyInsertion(50, [

				"customize" => "to_taste"
			]); // given
		}

		public function test_http_endpoint () {

			$this->get("/segment") // when

			->assertJsonStructure(["data" => [

				"id", "name", "quantity"
			]]); // then
		}
	}
```

Since `PHPUnit\Framework\TestCase` prevents any functionality from running only once after its `setUp` method, using this hook means that more than one test on the same class will incrementally see data pre-seeded for the previous test. Modifications to database rows will neither be reset nor removed in-between tests. This shouldn't be a problem for classes with just one test or tests not expecting a fixed set of elements.

If this experience proves to be an encumberance, available alternatives include:

- Moving test case to its own class.
- Testing the services directly i.e. without HTTP.

### Asserting database state

This is the automated equivalent of booting up your favorite DBMS to verify effect of a query on the database. `BaseDatabasePopulator` plants a `databaseApi` property providing access to programmatic assertions that would otherwise have been carried out visually.

```php

public function test_my_database_service () {

	// given => can either use pre-seeded data or insert desired state

	$this->getContainer()->getClass(DatabaseService::class)

	->performAction(); // when

	$this->databaseApi->assertDatabaseHas("products", [

		"expected" => "row"
	]); // then
}
```

An exhaustive list of [available database assertions](laravel.com/docs/8.x/database-testing#available-assertions) is maintained by the authors of Eloquent, but applies to any ORM adapter connected.

### Accessing test models

replicator (list methods),  ()