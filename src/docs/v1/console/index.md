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

## Connecting commands

Each module provides its own console config `Suphle\Contracts\Config\Console`, using its `commandsList()` method to expose available commands. The default configuration class to extend when including custom commands is `Suphle\Config\Console`.

## Running commands

This part is akin to opening a route collection URL in the browser. After creating and connecting your command, it can be ran from the CLI using,

```bash

php suphle command_signature argument=value
```

As is one of Suphle's most dominant principles, this is user/client-facing and only on rare occassions should you interact with your software through it. The recommended way to access or verify expected behavior is via the dedicated class for automating CLI tests.

## Testing commands

Console based tests have a test-type reminiscent of `Suphle\Testing\TestTypes\ModuleLevelTest`, but with some slight differences -- most notable is the inability to make HTTP assertions or in-bound requests. The designated class is `Suphle\Testing\TestTypes\CommandLineTest`.

### Setting up command test

Commands are being loaded into the test runner from the `setUp` method of your `CommandLineTest`. This makes it convenient for you to simply find command and run it
// example

This snippet assumes you aren't testing command itself, but its side effects. Behavior is usually what you want to test, through the underlying service

If indeed, the command is what you want to test, trying to provide a double to your modules within your test method, the double will not be acknowledged. In such cases, you want to inject your doubles from `getModules`
// example