## Requirements
- PHP 8.1+
- Composer

## Installation

Hurry to your CLI to install Suphle starter project through Composer.

```bash
composer require nmeri17/suphle-starter
```

Replace the contents of `AllModules\PublishedModules` in your project with this class:

```php

namespace AllModules;

use Suphle\Modules\ModuleHandlerIdentifier;

use Suphle\Hydration\Container;

use AllModules\Products\Meta\ProductsModuleDescriptor;

class PublishedModules extends ModuleHandlerIdentifier {
	
	public function getModules ():array {

		return [new ProductsModuleDescriptor(new Container)];
	}
}
```

Fire up your project using the following command:

```bash

php suphle project:create_new Products --module_descriptor="\AllModules\Products\Meta\ProductsModuleDescriptor"
```

All in all, we have successfully installed the starter project, created our first Suphle module, connected it to the rest of the application, and initiated a long-runner server to accept requests to it. Now, we're going to confirm our ability to visit a URL on the new module.

## Verifying project initialization

There's one URL predefined in the default module installed. We'll make a [quick trip](http://localhost:8080/products/hello) to it as most of us are already used to. Doing so is expected to show us a response with the following contents:

```json

{"message":"Hello World!"}
```

Congratulations? Well, not really. We were wrong to have verified a successful request through our browser. Now, let's do this again; this time, properly. Turn off the running server (Ctrl + C on windows) and run one of the tests accompanying your new installation.

```bash

cd vendor/bin

phpunit "project/path/AllModules/Products/Tests/ConfirmInstall.php"
```

If we get back the following output,

```
PHPUnit 8.5.31 by Sebastian Bergmann and contributors.

.                                                                   1 / 1 (100%)


Time: 714 ms, Memory: 18.00 MB

OK (1 test, 2 assertions)

```

Voila! We have a reproducible, irrefutable confirmation that our very first endpoint passes in flying colors. Now, we are ready for the serious business -- because, in our hands lies the power to build the **next big thing.** All that is left is for us to delve deeper into getting a better understanding of the possibilities we can accomplish with Suphle.

You can either take things easy, [sequentially](/docs/v1/modules) getting your feet wet. Or, you can hop right over to any other chapter on the enu that catches your fancy.

Have a jolly ride.