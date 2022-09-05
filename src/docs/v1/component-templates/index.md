## Introduction

Modules are by nature, independent and self-sufficient. But if we hope to build reusable modules, adjustments to that law is inevitable. There are two categories of possible augmentation we may want to make to our modules:
A. Implementation detail
B. Variables that aren't within the module's power to provide-- for example, limiting what routes are exposed by its route collection, user-editable views

As has been demonstrated in other chapters, [events](/docs/v1/events) and [direct invocation](/docs/v1/modules#) are the recommended methods for inter-module interaction. You usually want to *extend* modules when the domain-specific (or child) module relies on a more generic one (or parent) for either a bulk of its functionality or orchestrating its implementation details. But this orchestration can only be triggered by running the child module since the parent has no way of knowing all possible domain-level details. Once one module is layered above the other, we'll be faced with a new dilemma of connecting the module afresh to the list of published modules. Continuing on this path will ultimately land us at a complicated place of complex module parent chains, looking for things along trees. Thankfully, there is a shorter way that doesn't just solve this without incurring the issues mentioned above, but equally tackles category B, above -- **component templates**.

Component templates don't supercede modules, but are more like cousins to them. They don't have a definite structure and should only be the size of the functionality to be received from the consuming module. It is safe to define them as "a form of extending modules".

## Defining a component template

Components don't need to be published on Packagist before they're reused, although it can help when components scale into versions. The only requirement that qualifies a set of files as an installable template is by providing a sub-class of `Suphle\ComponentTemplates\BaseComponentEntry`. The simplest entry class would look like this:

```php
use Suphle\ComponentTemplates\BaseComponentEntry;

class ComponentEntry extends BaseComponentEntry {

	public function uniqueName ():string {

		return "ProjectNameTemplates";
	}

	protected function templatesLocation ():string {

		return __DIR__ . DIRECTORY_SEPARATOR . "ComponentTemplates";
	}
}
```

### Component entry methods

#### Set component name

To avoid clashes with publicly published components, component authors should prefix the value returned from `BaseComponentEntry::uniqueName()` with a camel-case of their vendor name. This value will be used as namespace in consuming module to read view files, but more importantly, classes that should be accessible to the auto-loaders.

#### Set templates location

We use `BaseComponentEntry::templatesLocation()` to point the default installer to where to read source files from. It's not necessary to specify files we don't intend to deposit within the consuming module. As we learnt earlier, it's safe for the bulk functionality to reside on the component itself. The template is for dispensable parts that can either provide implementation/domain-specific details to the parent, or cherry-pick relevant functionality.

## Ejecting component templates

All installable components for a module should be listed under `Suphle\Contracts\Config\ComponentTemplates::getTemplateEntries()` config method. `Suphle\Config\DefaultTemplateConfig` is used as default, so you're more likely to extend it. We populate this list with `BaseComponentEntry` classes such as the one defined above. Having a definite list means Suphle is aware of the module's component state, and can make informed decisions based on that. To install templates from entries on this list, we use the following command:

```bash

php suphle templates:install module_interface
```

As is, the command compares the list with installed components, skipping existing components to avoid overriding consumer changes

### The override option

Suppose unwanted changes have been made to installed template, or there has been new inclusions to the template source, we would want to re-eject the given component. The existing directory won't be deleted, although as you may expect, matching files will be overriden. To do this, we add the "override" option install command:

```bash

php suphle templates:install module_interface --override=Entry
```

Or using the shorthand option:

```bash

php suphle templates:install module_interface -o=Entry
```

We can combine multiple entries to be overriden at once

```bash

php suphle templates:install module_interface -o=Entry1 -o=Entry2
```

Or override all by leaving the option blank

```bash

php suphle templates:install module_interface --override
```

Be careful, as this will overwrite **all** changes made to your installed components.

## Custom ejection

The default installer uses its protected `fileConfig` and `fileSystemReader` properties for transfering files from `BaseComponentEntry::templatesLocation()` to the module's components path. Your component may require some more exotic addition to the this flow. To take over ejection, you can override the `BaseComponentEntry::eject()` method.

```php

public function eject ():void {

	$sourceFolder = $this->templatesLocation();

	// do something creative with its contents

	parent::eject();
}
```

This class provides the method `userLandMirror():string` for use in obtaining a dynamic path to template destination in the consuming module.

## Testing component installation

After developing our component, we test it as we would do for regular pieces of functionality. However, we'd also want to ensure that its ejection works as expected. This usually isn't a problem unless we've defined custom ejection logic. For this purpose, Suphle provides the specialized test-type, `Suphle\Testing\TestTypes\InstallComponentTest`, that offers a few helpers to be discussed below.

### Setting component to test

We use the `componentEntry()` method to inform the test-type what component we intend to test. Implementing this method is compulsory.

```php

protected function componentEntry ():string {

	return ExceptionComponentEntry::class;
}
```

### Verify install success

We use the `assertInstalledComponent()` method for this. It accepts a `$commandOptions` argument that is an array of options to pass to the console runner for the command under test. The method also takes an optional 2nd argument that should be set to true when the component may have been replaced with a mock that would prevent actual ejection.

```php

public function test_can_install_component () {

	$this->assertInstalledComponent($this->getCommandOptions());
}
```

Note that in order to confirm installation operation occured, it'll clear any content found at the intended install destination.

### Custom install assertion

`assertInstalledComponent` takes care of installation housekeeping for you. If you'd prefer more low-level control, you can use the `runInstallComponent()` method to trigger installation. It accepts component options similar to `assertInstalledComponent()`.

```php

public function test_will_not_override_existing () {

	// mock service classes

	$this->runInstallComponent($commandOptions); // when
}
```

This is not an assertion in and of itself but returns the execution result the install operation. This can be any of the constants on `Symfony\Component\Console\Command\Command`. A possible assertion would look as follows:

```php

$this->assertSame(

	$this->runInstallComponent($commandOptions), // when

	Command::SUCCESS
);
```

### Testing install modes

In addition to possible custom arguments passed to the component, you'd want to ensure it runs correctly in all states discussed earlier. Rather than manually filling them in, you're more likely to use the helper method `overrideOptions()` as data provider. It returns a dataset for each mode along with argument to be received by the ejector:

```php

/**
 * @dataProvider overrideOptions
*/
public function test_override_option_unserializes_properly (array $installModes, ?array $ejectorArguments) {

	// merge modes with custom arguments

	// when
	$this->assertInstalledComponent($installModes);
}
```