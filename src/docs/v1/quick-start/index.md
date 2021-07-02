## Requirements
- PHP 7.2+
- A web server
- Composer

## Installation
Hurry to your CLI and run

```bash
composer require nmeri17/suphple
```

Afterwards, scaffold your main module with

```bash
php suphple init --m Main
```

This creates the following folder structure in the current working directory

```
|	.htaccess
|___public
|	|	index.php
|___Modules
|	|___Main
|	|	|	MainDescriptor.php
|	|	|	MainExports.php
|	|	|___Controllers
|	|	|	|	MainController.php
|	|	|___Routes
|	|	|	|	MainBrowserRoutes.php
|	|	|___Requests
|	|	|	|	HelloWorld.php
|	|	|___Templates
|	|	|	|	RepeatSpoken.php
|	|	|___Tests
|	|	|	|___Unit
|___Interactions
|	|	MainModuleInterface.php
|___Models
|
```
Don't fret about what the purpose of the files you aren't familiar with is. Soon enough, we will get to understand them in depth.

## Your first request
From this point on, if we have a web server running, we can visit [http://localhost:8080/main](http://localhost/main), and see a response.

However, that isn't exciting enough. Navigate to `Modules/Main/Routes/MainBrowserRoutes` and include the following method

```php
public function SAY_foo ():array {

	return $this->_get(new Markup("replyMe"/*, RepeatSpoken*/));
}

```

Next, navigate to `Modules/Main/Controllers/MainController` and include this method

```php

use Modules\Main\Requests\HelloWorld;

public function replyMe (HelloWorld $request):array {

	return ["user_said" => $request->foo];
}

```

Now, when we open [http://localhost:8080/say/hi](http://localhost/say/hi), we are able to see exactly "Hi" even though it wasn't defined in the route pattern.

Congratulations! In your hands lies the power to build the **next big thing.** All that is left is for you to delve deeper into getting a better understanding of the possibilities that can be accomplish with Suphple. It has so many other interesting aspects, although the primary one of every web framework is making a request and getting responses back

You can take things easy, [sequentially](/docs/v1/modules) getting your feet wet, or could hop over to [routing](/docs/v1/routing) which we just perused.

Have a jolly ride.