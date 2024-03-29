## Introduction

The database layer can be considered as the heart of your program. It's where we describe nouns or entities that drive the application. If you visualize your software, picture this layer residing on the outskirts of the application, independent of the [modules](/docs/v1/modules), and are all accessible to each other.

## Choosing an ORM

An object relational mapper, though not absolutely crucial, is often used to abstract away rows and functionality from the walls of the database server, into strongly-typed objects. PHP happens to be furnished with some established ORM libraries (not limited to [Eloquent](laravel.com/docs/8.x/eloquent) and [Cycle ORM](cycle-orm.dev)), with vast coverage of most possible database needs. Suphle keeps an open mind regarding your choice of which to use. If you are at a loss and could use some recommendation, do read on.

### Active Record pattern

Relatively static applications may be content with using an ORM that supports this pattern. Eloquent, mentioned above, is a powerful implementation that can serve. However, some believe this pattern to be plagued by an inherent design flaw that can make code maintenance a nightmare. 

When using this pattern, the models will expect a database connection to have been established for them. Consuming modules should endeavor to do this as early as possible, simply by calling the parent.

```php

use Suphle\Contracts\Database\OrmDialect;

use Suphle\Tests\Mocks\Interactions\ModuleOne;

class ModuleOneDescriptor extends ModuleDescriptor {

	public function exportsImplements():string {

		return ModuleOne::class;
	}

	protected function registerConcreteBindings ():void {

		parent::registerConcreteBindings();

		// your bindings here...
	}
}
```

When you have no custom bindings to make, it's OK to remove this module's `registerConcreteBindings` override.

In order to combat the typing problem and avoid magical pitfalls associated with this pattern, your software may benefit more from using Data Mappers. This is where an adaptation such as Cycle ORM starts to shine.

### DDD pattern

This pattern is yet to be explored in Suphle. Thus, no informed recommendation can be made. This is most evident in the following assumptions that are adjacent to DDD principles:

1. Our models are anemic
1. Chances of replacing our ORM in future are next to none

Whichever direction is most suitable for your application, it is recommended that as much as is possible, access to each model/entity is restricted to its managing module and its services.

## Models location

Since Modules are expected to be opaque to their consumers, a module interface that returns a value typed to an internal model will warrant its consumers reach into the module for the model's type, which is unacceptable. Thus, models and indeed, any type whose usage transcends one module, ought to be situated in a visible, global scope.

To this end, the default database [component template](/docs/v1/component-templates) behaves differently from regular templates. Instead of emptying its contents into each module where it's installed, it launches them into a database folder on the project root. From this vantage point, each model is visible to consuming modules. The folder name and its associated namespace are derived from some of the methods on the `Suphle\Contracts\Config\Database` interface.

For the sake of convenience, you won't have to override these methods, but the `Database::relativeFolderName` property, which defaults to `AppModels`.

```php

use Suphle\Contracts\{Config\Database, IO\EnvAccessor};

class PDOMysqlKeys implements Database {

	protected string $relativeFolderName = "AppModels";
}
```

As is, that folder will be created at the project's root after your first module creation or a module's components installation. In addition, that namespace has been designated in your Composer's list of autoloads. If you would prefer a more intuitive name, remember to update this value in the `composer.json`. To replace installation location altogether, override the `componentInstallPath` and `componentInstallNamespace` methods. The default implementation is as follows:

```php

use Suphle\Contracts\{Config\Database, IO\EnvAccessor};

class PDOMysqlKeys implements Database {

	/**
	 * {@inheritdoc}
	*/
	public function componentInstallPath ():string {

		return $this->fileConfig->getRootPath().

		$this->relativeFolderName . DIRECTORY_SEPARATOR;
	}

	public function componentInstallNamespace ():string {

		return $this->relativeFolderName;
	}
}
```

As you will imagine, this same location houses the model's migrations, for better proximity when pointing models to [their related migrations](#Configuring-table-structure).

### Connecting the user model

This is a unique model ubiquituous across not only a wide variety of domains but application components -- most notably, authorization and authentication. As was discussed in the [model authorization](/docs/v1/authorization#Evaluating-user-model) chapter, model authorities are eagerly evaluated during the [module boot phase](#Active-Record-pattern). Its implication is that the ORM is unusable without the presence of a `Suphle\Contracts\Auth\UserContract` binding.

For this reason, the `Suphle\Contracts\Hydration\InterfaceCollection` implementation in each module contains the following binding:

```php

use Suphle\Contracts\{Config\Router, Auth\UserContract};

use AppModels\User as EloquentUser;

use ModuleInteractions\Products;

class CustomInterfaceCollection extends BaseInterfaceCollection {

	public function simpleBinds ():array {

		return array_merge(parent::simpleBinds(), [

			Products::class => ModuleApi::class,

			UserContract::class => EloquentUser::class
		]);
	}
}
```

Because, component templates and module installation are run by different processes, it's not possible to elegantly or implicitly replace the database folder on this class while running the processes. Thus, the namespace is hard-coded to `AppModels`. If you're using a different value for that namespace, update this namespace on your [module template](/docs/v1/modules#Creating-a-module).

## ORM adapters

In order to unify working with the ORM choices available, Suphle provides a few contracts for them to be defined by, grouped under the `Suphle\Contracts\Database` namespace. [So far](github.com/nmeri17/suphle/issues/20), only an Eloquent adapter has been written. As such, the rest of this chapter will refer to it as de-facto underlying client.

### Eloquent models

Majority of your interaction with an ORM will be done against methods on its parent model. This adapter offers a class that makes some slight adjustments in order to checkmate dangerous practises such as:

- Models not having factories or migrations
- Indiscriminate access to model instances using facades

This class is known as `Suphle\Adapters\Orms\Eloquent\Models\BaseModel` and all models are expected to extend it. Specifics regarding factories are described in greater detail on [their documentation page](https://laravel.com/docs/8.x/database-testing#defining-model-factories), although you may want to look at off the shelf [solutions at automating](github.com/mpociot/laravel-test-factory-helper) this task.

Within the default interface loader of `OrmDialect`, a call is placed to boot all models into their strict mode. This prevents them from:

- Lazy loading relationships, which can be risky when present because they can be used within loops.
- Assigning non-fillable columns/attributes.
- Reading unfetched or non-existent columns/properties.

These benefits work under the premise that your codebase is automatedly tested. The consequence of not doing so is that any violation of those rules in production will be penalized with a failed request.

#### Configuring the database

Before any operation can be run against the database, it must be created and its server details surrendered to Suphle. The config interface used for this is `Suphle\Contracts\Config\Database`, through its `getCredentials` method. The array returned is expected to fit whatever shape is required by the underlying ORM. The default credentials look like this:

```php

use Suphle\Contracts\{Config\Database, IO\EnvAccessor};

class PDOMysqlKeys implements Database {

	public function getCredentials ():array {

		return [
			"default" => [

				"host" => $this->envAccessor->getField("DATABASE_HOST"),

				"database" => $this->addParallelSuffix(

					$this->envAccessor->getField("DATABASE_NAME")
				),

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

In order to encourage a feature-based, incremental approach toward development, models are required to list all [migrations](https://laravel.com/docs/9.x/migrations) pertaining to them, using the `BaseModel::migrationFolders` method.

```php

use Suphle\Adapters\Orms\Eloquent\Models\BaseModel;

class Employer extends BaseModel {

	// define relationships

	protected static function newFactory ():Factory {

		return EmployerFactory::new();
	}

	public static function migrationFolders ():array {

		return [__DIR__ . DIRECTORY_SEPARATOR . "Migrations"];
	}
}
```

While testing `Employer`, the test runner will scan specified directories in an attempt to boot the database to a state relevant for the feature under test. Outside a test environment, migrations can still be run by interfacing with the Artisan CLI.

```bash

php suphle bridge:laravel "make:migration create_employers_table --path=Migrations"
```

The `path` argument is relative to Laravel's base folder, which in Suphle, conforms to the component's location on the module. However, this rigid constraint conflicts with Suphle's architecture, where [models reside outside the module](#Models-location) and are expected to reference their migrations' location. To avoid coupling your models to the component class, the only choice left is for the freshly created migration files to share the same location with their parent models.

## Testing the data layer

Database testing is restricted to module-level test-types, in accordance with the Eloquent ORM. The next paragraph can be skipped if the reason for this is irrelevant to you.

In order to synchronize URL requests coming into the Suphle application with the container (and [possible router](/docs/v1/bridges#Handling-Laravel-routes)) necessary for the ORM to function, a `RequestDetails` instance is required when accessing either database objects or the crutches that facilitate testing this layer. Soon after its creation, this instance emits an event, `RequestDetails::ON_REFRESH`, and [as you know](/docs/v1/events/#Setting-an-event-manager), events cannot exist without a module.

Any test whose needs cuts across any of these entities is advised to include a call to the `parent` class from your `Events` implementation.

```php

use Suphle\Events\EventManager;

class AssignListeners extends EventManager {

	public function registerListeners():void {

		parent::registerListeners();
		
		// your bindings here...
	}
}
```

That's all there is to the module-level restraint. `Suphle\Testing\Condiments\BaseDatabasePopulator` is a trait used for exposing ORM agnostic pointers for modifying and observing the state of the database before and after making changes in the testing context.

### Declaring test model

Most significant in `BaseDatabasePopulator`s tool-kit is an abstract method, `getActiveEntity`.

```php

use Suphle\Testing\{TestTypes\ModuleLevelTest, Condiments\BaseDatabasePopulator;

class EmploymentServiceTest extends ModuleLevelTest {

	use BaseDatabasePopulator;

	protected function getActiveEntity ():string {

		return Employment::class;
	}
}
```

The amount of seeders ran is 10 but can be modified by returning a more appropriate figure from the `BaseDatabasePopulator::getInitialCount` method.

```php

class EmploymentServiceTest extends ModuleLevelTest {

	use BaseDatabasePopulator;

	protected function getInitialCount ():int {

		return 200;
	}
}
```

These entities will be infused into their attached table for each test on the test class.

### Database retention mode

One effective technique in curbing lengthy test execution is by tracking migration changes and only running them on changes, because migrating table schema notoriously takes copious amounts of time, thereby prolonging test execution. Since it's unlikely for migrations to be updated in between your test execution, it's safe to reuse the same migration table and its databases. For this reason, the default behavior is for the database not to be cleared. Transactions are used to temporarily seed the database per test method /case. What this means is that database-based tests [employing multiple modules](#Database-connection-in-between-resets) will leave residual data behind, which will accumulate if left unchecked.

While long lived test databases accelerate test speed, a recommended middle ground is to occasionally cleanse vestigial data. In order to eject from the default retention mode, the migrator requires the presence of the `SUPHLE_NUKE_DB` environment variable while running the tests. There are a few ways to pass environment variables to the test runner but perhaps, the most convenient is via use of the configuration schema:

```xml
<?xml version="1.0" encoding="UTF-8"?>

<phpunit
	colors = "true"
>
	<testsuites>

		<testsuite name="integration">
			<directory>./tests/integration</directory>
		</testsuite>

		<testsuite name="unit">
			<directory>./tests/unit</directory>
		</testsuite>
	</testsuites>

	<php>
		<ini name="error_reporting" value="-1" />
		<env name="SUPHLE_NUKE_DB" value="true" />
	</php>
</phpunit>
```

This configuration is then connected as usual:

```bash

phpunit "/project/path/tests" -c="/path/to/phpunit.xml"
```

#### Retained mode policy

The potential retention of database state across implies adherence to a testing style that although uncomplicated, compliance to it will favour the robustness of your tests in general.

1. This mode dictates that database-based tests shouldn't assume the database is either empty or the size of seeded data. The number of rows each test works with cannot be static, but must be determined by [reading its current value](#Count-test-data), usually before commencing the operation expected to modify number of elements on affected models.

1. Database transactions don't reset auto-incremented primary keys. For tests to be independent of preceding conditions, they are prohibited from relying on the presence of static IDs at the beginning of the test.

If we have a feature whose implementation exercises a hard-coded value, we could make our test dynamic for both retained and recycled database runs like so:

```php

public function test_feature_for_specific_model () {

	$this->safeFetchUser5();

	// rest of the test
}

protected function safeFetchUser5 ():UserContract {

	$user5Fields = ["id" => 5];

	$userList = $this->replicator->getSpecificEntities(1, $user5Fields);

	if (count($userList)) return $userList[0];

	return $this->replicator->modifyInsertion(1, $user5Fields)[0];
}
```

This style is a more convenient course of action than wiping and manually re-seeding the models.

1. Potentially left-over data may clash with one of the incoming data generated by the seeding library, resulting in unpredictable test failures that pass when re-tried.

### Database connection in-between resets

Whenever a URL change occurs, the handling Container is ridded of all objects that were hydrated during the previous request, in preparation for the current one. As was [earlier mentioned](#Active-Record-pattern), Active-Record ORMs must be initiated on behalf of the entities intended to rely on it. However, doing so means that a new connection must be established. The unobstrusive caveats associated with this on database-based tests are discussed below.

- Each test case attempts to run within a transaction. That transaction is disrupted if a fresh database connection is established (for example, so that any module that eventually handles request is sure to see the same fixtures). What this means is that when tests in the `ModuleLevelTest` family are composed of more than one module descriptor, each test case will see data fixtures seeded or inserted during the preceding test case, if any.

```php

class MultiModuleRetainTest extends ModuleLevelTest {

	use BaseDatabasePopulator;

	protected function getModules ():array {

		return [

			new ModuleOneDescriptor(new Container),

			new ModuleTwoDescriptor(new Container)
		];
	}

	protected function getActiveEntity ():string {

		return Employment::class;
	}

	public function test_1 () {

		// given, when, then
	}

	public function test_2 () {

		// this test will both data seeded for `test_1` along with any insertion it made
	}
}
```

- Modifications to database rows made before and during a connection-resetting actions like an HTTP request, will neither be reset nor removed in-between tests, but remain visible to the tester after a response is returned i.e. in spite of resets in-between multi-module routing.

```php

class MultiModuleRetainTest extends ModuleLevelTest {

	use BaseDatabasePopulator;

	protected function getModules ():array {

		return [

			new ModuleOneDescriptor(new Container),

			new ModuleTwoDescriptor(new Container)
		];
	}

	protected function getActiveEntity ():string {

		return Employment::class;
	}

	public function test_can_update_seeded_data () {

		// In spite of this connection, any seeded or factory-inserted data will be available for assertion after the operation completes and indeed, for the lifetime of the test
		$this->post($somePath, $payload); // when

		// then
	}
}
```

### Overriding test setup

This trait hooks into your test type's `setUp` process, thereby prohibiting its regular modification. If you have additional operations to run after `parent::setUp`, the trait's `setUp` must be aliased:

```php

class EmploymentServiceTest extends ModuleLevelTest {

	use BaseDatabasePopulator {

		BaseDatabasePopulator::setUp as databaseAllSetup;
	}

	private SomeType $myProperty;

	protected function setUp ():void {

		$this->databaseAllSetup();

		$this->myProperty = $this->getFromSomewhere();
	}
}
```

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

An exhaustive list of [available database assertions](https://laravel.com/docs/8.x/database-testing#available-assertions) is maintained by the authors of Eloquent, but applies to any ORM adapter connected.

### Accessing test models

`BaseDatabasePopulator` provides handles for manipulating the connected model created during and in the aftermath of the seeding phase. These handles are abstracted to be ORM adapter-agnostic and stored on its `replicator` property. Below, we'll look at some of its methods.

#### Inserting new models

Additional data can be created on the table before performing the subject action, usually to insert data more custom than the base factory. For this, we use `modifyInsertion` method. For basic cases, it'll simply take the number of entries to insert for connected model,

```php

$this->replicator->modifyInsertion(10);
```

The above will return an iterable of all inserted models. Its 2nd argument takes an array of data to apply to the table.

```php

protected function setUp ():void {

	parent::setUp();

	$this->employment = $this->replicator->modifyInsertion(

		1, ["salary" => 850_000]
	)[0];
}
```

For more complex needs beyond the table's columns, a callback can be provided as 3rd argument, that would enable the models to be built as much as underlying ORM permits:

```php

protected function setUp ():void {

	parent::setUp();

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

#### Retrieving inserted models

Models can be obtained in a few ways, depending on your needs. However, before their retrieval, you will recall where we made mention of [lazy-loading being disabled](#Eloquent-models) for all models. This means that any model retrieved by the methods discussed in this section will throw a `Illuminate\Database\LazyLoadingViolationException` when their relations are being read without first being eagerly loaded. In order to avoid this error during retrieval, a list of relations must be submitted beforehand.

If there's no constraint on model properties, a random instance can serve. We get them using either `getRandomEntity` or `getRandomEntities` method for one or more entries, respectively.

```php

public function test_unauthorized_user_cant_perform_operation () {

	[$employment1, $employment2] = $this->replicator->getRandomEntities(2); // OR 

	$employment = $this->replicator->getRandomEntity();

	// do thing with these entities
}
```

Both methods take an optional 1st and 2nd argument respectively, named `relations`, for passing relations to eagerly load.

```php

$employment = $this->replicator->getRandomEntity(["employer.user"]);
```

Tests verifying behavior for specific constraints should use the `getSpecificEntities` method to apply column clauses like so:

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

`getSpecificEntities` takes an optional 3rd argument for setting relationships to eagerly load.

#### Count test data

In the above test, we can either assert the contents of the rows retrieved or simply verify that number of modified rows matches expectations using the `getCount` method. At every point, this method returns number of entries on the table.

```php

$this->assertSame($numFieldsToReturn, $this->replicator->getCount());
```