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

Within the default interface loader of `OrmDialect`, a call is placed to boot all models into their strict mode. This prevents them from:

- Lazy loading relationships, which can be risky when present because they can be used within loops.
- Assigning non-fillable columns/attributes.
- Reading unfetched or non-existent columns/properties.

These benefits work under the premise that your codebase is automatedly tested. The penalty of not doing so is that any violation of those rules in production will be penalized with a failed request.

#### Configuring the database

Before any operation can be run against the database, it must be created and its server details surrendered to Suphle. The config interface used for this is `Suphle\Contracts\Config\Database`, through its `getCredentials` method. The array returned is expected to fit whatever shape required by the underlying ORM.

```php

use Suphle\Contracts\{Config\Database, IO\EnvAccessor};

class PDOMysqlKeys implements DatabaseContract {

	public function __construct (protected readonly EnvAccessor $envAccessor) {

		//
	}

	public function getCredentials ():array {

		return [
			"default" => [

				"host" => $this->envAccessor->getField("DATABASE_HOST"),

				"database" => $this->envAccessor->getField("DATABASE_NAME"),

				"username" => $this->envAccessor->getField("DATABASE_USER"),

				"password" => $this->envAccessor->getField("DATABASE_PASS"),

				"driver" => "mysql",

				"engine" => "InnoDB"
			]
		];
	}
}
```

#### Configuring table structure

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

Since `PHPUnit\Framework\TestCase` prevents any functionality from running only once after its `setUp` method, using this hook means that more than one test on the same class will incrementally see data pre-seeded for the previous test. Modifications to database rows made after connection-resetting actions like an HTTP request, will neither be reset nor removed in-between tests. This shouldn't be a problem for database classes with:

- Just one test.
- Tests not expecting a fixed set of elements.
- Database assertions without HTTP requests.

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

`BaseDatabasePopulator` provides handles for manipulating the connected model created during and in the aftermath of the seeding phase. These handles are abstracted to be ORM adapter-agnostic and stored on its `replicator` property. Below, we'll look at some of its methods.

#### Inserting new models

Additional data can be created on the table before performing the subject action, usually to insert data more custom than the base factory. For this, we use `modifyInsertion` method. For basic cases, it'll simply take the number of entries to insert for connected model,

```php

$this->replicator->modifyInsertion(10);
```

The above will return an iterable of all inserted models. Its 2nd argument takes an array of data to apply to the table.

```php

protected function preDatabaseFreeze ():void {

	$this->employment = $this->replicator->modifyInsertion(

		1, ["salary" => 850_000]
	)[0];
}
```

For more complex needs beyond the table's columns, a callback can be provided as 3rd argument, that would enable the models to be built as much as underlying ORM permits:

```php

protected function preDatabaseFreeze ():void {

	$this->employment = $this->replicator->modifyInsertion(

		1, [], function ($builder) {

			$employer = Employer::factory()

			->for(EloquentUser::factory()->state([

				"is_admin" => true
			]))->create();

			return $builder->for($employer);
		}
	)[0];
}
```

Examples above use this method within `preDatabaseFreeze` since that's where insertions will survive HTTP requests. When not writing such tests, `modifyInsertion` is callable from any scope.

#### Retrieving inserted models

Models can be obtained in a few ways, depending on your needs. If there's no constraint on model properties, a random instance can serve. We get them using either `getRandomEntity` or `getRandomEntities` method for one or more entries, respectively.

```php

public function test_unauthorized_user_cant_perform_operation () {

	[$employment1, $employment2] = $this->replicator->getRandomEntities(2); // OR 

	$employment = $this->replicator->getRandomEntity();

	// do thing with these entities
}
```

Tests verifying behavior for a specific user should use the `getSpecificEntities` method to apply column clauses like so:

```php

public function test_modified_expected_rows () {

	$clauses = ["where" => "foo"];// given

	$this->getContainer()->getClass(DatabaseService::class)

	->someOperation($clauses); // when
	
	$numFieldsToReturn = 100;

	$modifiedRows = $this->replicator->getSpecificEntities(

		$numFieldsToReturn, $clauses
	);

	// then
}
```

#### Count test data

In the above test, we can either assert the contents of the rows retrieved or simply verify that number of modified rows matches expectations using the `getCount` method. At every point, this method returns number of entries on the table.

```php

$this->assertSame($numFieldsToReturn, $this->replicator->getCount());
```