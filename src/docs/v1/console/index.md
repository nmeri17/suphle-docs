## Introduction

This chapter focuses on the details of writing commands where the end-user interfaces with the command-line rather than a web browser or an HTTP request over the wire. Commands are not as intimidating as you may think. They're simply a conduit for conveying input in form of command arguments to service classes, in a similar manner to controllers forwarding request parameters to your service classes. The only difference is that Suphle is entirely responsible for delivering request parameters to controllers while, with the CLI, Suphle leverages the [Symfony Console](https://symfony.com/doc/current/components/console.html) component that not only captures the essence of command line input, but contains advanced features such as forking and executing asynchronous processes on diverse OSes. 

What we'll be looking at here is testing and linking commands to Suphle modules. Knowledge of Symfony console arguments definition is required to proceed.

## Declaring commands

Commands are expected to extend `Suphle\Console\BaseCliCommand`. It's on this sub-class that we'll define the command signature, arguments, and connect it to the executing service. An average command class can be expected to look as follows:

```php
use Suphle\Console\BaseCliCommand;

use Suphle\Tests\Mocks\Modules\ModuleOne\Concretes\BCounter;

use Symfony\Component\Console\{Output\OutputInterface, Command\Command};

use Symfony\Component\Console\Input\{InputInterface, InputArgument};

class AltersConcreteCommand extends BaseCliCommand {

	public const NEW_VALUE_ARGUMENT = "new_value";

	protected function configure ():void {

		parent::configure();

		$this->addArgument(
			
			self::NEW_VALUE_ARGUMENT, InputArgument::REQUIRED, "Value to update concrete to"
		);
	}

	public static function commandSignature ():string {

		return "test:alters_concrete";
	}

	public function execute (InputInterface $input, OutputInterface $output):int {

		$moduleInterface = $input->getOption(self::HYDRATOR_MODULE_OPTION);

		$this->getExecutionContainer($moduleInterface)->getClass(BCounter::class)

		->setCount($input->getArgument(self::NEW_VALUE_ARGUMENT));

		$output->writeln("Operation completed successfully");

		return Command::SUCCESS; // Command::SUCCESS/FAILURE/INVALID
	}
}
```

First, we define a class constant `NEW_VALUE_ARGUMENT` on our command. Although it's not a strict requirement, it's strongly recommended to declare all command arguments and options using class constants, as a single source of truth.

Next, we have the method `configure()`. This is where options and arguments pertaining to this command are designated. In the above command, we can be seen calling `parent::configure()`. This is necessary, as `BaseCommand` does a few things for us.

The signature of the `execute()` method is identical to its Symfony counterpart, but its contents differ in a way that should be of interest. We use the following call to retrieve the underlying service containing logic for this command.

```php

$moduleInterface = $input->getOption(self::HYDRATOR_MODULE_OPTION);

$this->getExecutionContainer($moduleInterface)->getClass(BCounter::class);
```

The reason we don't use the contructor to inject it is that in a given application, numerous modules may contain the same command. However, during execution, we would rather narrow down execution or modification to one target module at a time. An example is the [component install](/docs/v1/component-templates) command, or the artisan migration commands.

The `BaseCliCommand::HYDRATOR_MODULE_OPTION` (or, the `--hydrating_module` flag), enables the caller specify what module context to execute in. When this context is not mandatory for a command, the option can be removed by setting `BaseCliCommand::withModuleOption` to false.

```php
class AltersConcreteCommand extends BaseCliCommand {

	public const NEW_VALUE_ARGUMENT = "new_value";

	protected $withModuleOption = false;
}
```

In this case, `getExecutionContainer()` will simply fallback to the first module for hydrating dependencies or the logic service. In fact, when going this route, you can bypass `getExecutionContainer()`, altogether and inject said dependency from the constructor; although, you may want to keep things uniform, and avoid the risk of forgetting the call to `parent::_construct()`.

### Referencing vendor/bin

Suphle provides the `Suphle\Server\VendorBin` class to simplify access to binaries domiciled in that directory. It has, among others, the handy `setProcessArguments` method for sending in binary name and arguments, and retrieving a `Symfony\Component\Process\Process` object for monitoring activity or flushing output.

Suppose we have a service that interacts with an `ft` binary, it will have the following signature:

```php

use Suphle\Server\VendorBin;

class FTWrapper {

	public function __construct (protected readonly VendorBin $vendorBin) {

		//
	}

	public function triggerFTBinary (array $argumentList):bool {

		return $this->vendorBin->setProcessArguments("ft", $argumentList)

		->isSuccessful();
	}
}
```

`FTWrapper` can then be used like any other service in the actual command. The complete documentation for the `Process` class can be found [here](https://symfony.com/doc/current/components/process.html), where you can see other things to do aside verifying binary executed successfully. The example above simply returns this status rather than defining the commands reaction to execution status because output should be controlled by the calling layer. Another caller may prefer a different output to the same outcome. It also allows the service be tested without rigging up a command testing setup.

## Connecting commands

Each module provides its own console config `Suphle\Contracts\Config\Console`, using its `commandsList()` method to expose available commands. The default configuration class to extend when including custom commands is `Suphle\Config\Console`.

## Running commands

This part is akin to opening a route collection URL in the browser. After creating and connecting your command, it can be ran from the CLI using,

```bash

php suphle command_signature argument=value
```

As is one of Suphle's most dominant principles, this is user/client-facing and only on rare occassions should you interact with your software through it. The recommended way to access or verify expected behavior is via the dedicated class for automating CLI tests.

## Testing commands

Console based tests have a test-type reminiscent of `Suphle\Testing\TestTypes\ModuleLevelTest`, but with the sole difference that is their inability to make HTTP assertions or in-bound requests. The designated class is `Suphle\Testing\TestTypes\CommandLineTest`.

Commands are being extracted from all the modules and loaded into the test runner from your `CommandLineTest::setUp()` method. This makes it convenient for you to simply find command and run it as is described by the component's authors. A simple test of the above command would turn out like this:

```php
class AltersConcreteTest extends CommandLineTest {

	protected function getModules ():array {

		return [new ModuleOneDescriptor(new Container) ];
	}

	public function test_can_run_alter_command () {

		$command = $this->consoleRunner->findHandler(

			AltersConcreteCommand::commandSignature()
		);

		$commandTester = new CommandTester($command);

		$commandTester->execute([

			AltersConcreteCommand::NEW_VALUE_ARGUMENT => 8
		]);

		// then
		$commandTester->assertCommandIsSuccessful(); // $commandTester::getDisplay can be used to extract console output as a string
	}
}
```

Short and simple. A few things to observe from this test's contents:

- We didn't clutter it with verifications about behavior of the underlying service. Just as we prevent the dichotomy between API and web routes by decoupling business logic from client medium or input source, we relegate command classes to consumers of service classes containing logic. When not extensive, this test can be responsible for verifying that service's side effect. Otherwise, we take of advantage of abstracting the logic by extracting the logic's test to its own method or class.

- The class above affirms command executed properly; it doesn't test the command itself. If you have any need to test the command, trying to provide a double to your modules within your test method, the double will not be acknowledged. In such cases, you want to inject your doubles from `getModules`.

```php
class AltersConcreteTest extends CommandLineTest {

	protected function getModules ():array {

		return [

			$this->replicateModule(ModuleOneDescriptor::class, function (WriteOnlyContainer $container) {

				$consoleConfig = Console::class;

				$container->replaceWithMock($consoleConfig, $consoleConfig, [

					"commandsList" => [$this->sutName]
				])
				->replaceWithConcrete(
					$this->sutName,
					
					$this->replaceConstructorArguments($this->sutName, [])
				);
			})
		];
	}

	public function test_can_run_alter_command () {

		// trigger execution
	}
}
```

This is the recommended way to inject things within module-based tests. Notice the use of `replaceConstructorArguments` over other doubling variants. Symfony commands will not run if their constructor is not invoked. Unlike other objects, we can get away with doubling commands in this manner since their constructor has no parameters.

### Testing vendor/bin

When executing the commands in your modules within a test environment, Suphle's CLI runner will use the titular module's `ModuleFiles::getRootPath` method to determine where to execute. This is usually fine since all custom files you intend to read or work with take their root from the project's entry path. However, the case is different for commands that interact with the `vendor/bin` folder, since additional effort is needed to locate it dynamically from the test scope.

#### Setting vendor path

In order to adequately test such commands, it's recommended that the part of the service invoking the binary is decoupled by stubbing it out before executing the command. It's a convenient method to use for binaries that are comfortable with receiving a file or folder to work with as an argument. It allows the test fixtures exist in dynamic paths independent of a fixed file structure.

Suphle provides the `Suphle\Testing\Proxies\RealVendorPath` trait for facilitating operations performed on `vendor/bin` from the test scope, irrespective of the test class's relative path to that folder.

Bringing this to our `FTWrapper` service above, its command's test could look like this:

```php


class FTCommandTest extends CommandLineTest {

	protected function getModules ():array {

		return [new ModuleOneDescriptor(new Container) ];
	}

	public function test_command_does_x_on_success () {

		$wrapperName = FTWrapper::class;

		$this->massProvide([

			$wrapperName => $this->positiveDouble($wrapperName, [

				"triggerFTBinary" => true
			])
		]);

		$command = $this->consoleRunner->findHandler(

			FTCommand::commandSignature()
		);

		$commandTester = new CommandTester($command);

		$commandTester->execute([

			FTCommand::FILE_ARGUMENT => "random/path"
		]);

		// then // test command output or command specific behavior
	}
}
```

Then the wrapper service can be tested exclusively by supplying arguments to it.

```php

use AllModules\Tests\Mocks\Modules\ModuleOne\Concretes\Commands\FTEvaluate1;

use Suphle\Testing\{TestTypes\ModuleLevelTest, Proxies\RealVendorPath};

use ReflectionClass;

class FTWrapperTest extends ModuleLevelTest {

	use RealVendorPath;

	protected function getModules ():array {

		return [new ModuleOneDescriptor(new Container) ];
	}

	public function test_can_successfully_read_file () {

		$this->setVendorPath();

		$sampleFile = (new ReflectionClass(FTEvaluate1::class))->getFileName();

		$status = $this->getContainer()->getClass(FTWrapper::class)

		->triggerFTBinary(
			[$sampleFile] // given
		); // when

		$this->assertFalse($status); // then
	}
}
```

#### Setting test execution path

It isn't always possible to remotely set the vendor path since not all binaries collect specific entries to work with through a flag. In addition, your command wrapping the binary may either want to obscure such an entry or may not specify a file, prefering to run some functionality across the codebase. In this situation, the solution is to switch the directory the test CLI runner considers as root to one above your project. This is done by overriding the `CommandLineTest::getRunnerPath` method with an alternate value to use. For our `vendor/bin` challenge, we can safely relegate the path generation to `RealVendorPath` like so:

```php

class FolderScannerCommadTest extends CommandLineTest {

	use RealVendorPath;

	protected function getRunnerPath ():string {

		return $this->getVendorParent();
	}

	protected function getModules ():array {

		return [new ModuleOneDescriptor(new Container) ];
	}

	public function test_can_scan_project () {

		// run your regular command test
	}
}
```