## Requirements
- PHP 8.1+
- Composer

## Installation

Launch your terminal into the system's web folder to install Suphle's starter bootstrapper:

```bash

cd "C:\wamp64\www"

composer create-project nmeri/suphle-starter AwesomeProject

cd AwesomeProject
```

To make things happen, we create our first Module. It can be named anything but for illustrative purposes, let's create a `Products` module:

```bash

php suphle modules:create Products --module_descriptor="\AllModules\Products\Meta\ProductsDescriptor"
```

You can explore what files were generated for you at the end of this tutorial, but in the meantime, let's connect the fresh module to the rest of the application, for it to begin intercepting requests. Make the following adjustments to the `AllModules\PublishedModules.php` class in your project:

```diff
<?php

namespace AllModules;

use Suphle\Modules\ModuleHandlerIdentifier;

use Suphle\Hydration\Container;

+ use AllModules\Products\Meta\ProductsDescriptor;

class PublishedModules extends ModuleHandlerIdentifier {
	
	public function getModules ():array {

+		return [new ProductsDescriptor(new Container)];
	}
}

?>
```

All is set! Now, we're going to confirm our ability to visit a URL on the new module.

## Verifying project initialization

There's one URL predefined in the default module template. To access it, return to the terminal and spin up the application server using this command.

```bash

php suphle server:start AllModules "/path/to/AwesomeProject/dev-rr.yaml"
```

We'll make a quick trip to [the default URL](http://localhost:8080/products/hello) as most of us are already used to, and expect to find the following contents waiting for us:

```json

{"message":"Hello World!"}
```

Congratulations? Well, not really. We were wrong to have verified a successful request through our browser. Now, let's do this again; this time, properly. Turn off the server running on the terminal (Ctrl + C on windows) and execute one of the tests accompanying your new installation.

```bash

cd vendor/bin

phpunit "project/path/AllModules/Products/Tests/ConfirmInstall.php"
```

If we get back the following output,

```
PHPUnit 9.6.6 by Sebastian Bergmann and contributors.

.                                                              1 / 1 (100%)


Time: 00:01.077, Memory: 16.00 MB

OK (1 test, 2 assertions)

```

Voila! We have a reproducible, irrefutable confirmation that our very first endpoint passes in flying colors. Now, we are ready for the serious business -- because, in our hands lies the power to build the **next big thing.** All that is left is for us to delve deeper into getting a better understanding of the possibilities we can accomplish with Suphle.

You can either take things easy, [sequentially](/docs/v1/modules) getting your feet wet. Or, you can hop right over to any other chapter on the menu that catches your fancy. Either way you prefer, please endeavor to scour all pages of this documentation instead of assuming your existing practices are correct or applies In Suphle. Don't be satisfied with knowing [how to intercept incoming payload](/docs/v1/service-coordinators#Retrieving-request-input); finishing the chapter should teach you a thing or two about events and exceptions, what actions should be taken there, etc.

Have a jolly ride.
