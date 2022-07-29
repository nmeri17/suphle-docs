## Requirements
- PHP 7.2+
- A web server
- Composer

## Installation
Hurry to your CLI and run

```bash
composer require nmeri17/suphple
```

Afterwards, initialize your project with

```bash
php suphple create-project --m Main
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
|	|	|___Config
|	|	|	|	FileConfig.php
|	|	|	|	RouterConfig.php
|	|	|___Controllers
|	|	|	|	MainController.php
|	|	|___Routes
|	|	|	|	MainBrowserRoutes.php
|	|	|___Requests
|	|	|	|	HelloWorld.php
|	|	|___Markup
|	|	|	|	RepeatSpoken.php
|	|	|___Tests
|	|	|	|	phpunit.xml
|	|	|	|___Unit
|___Interactions
|	|	IMainModule.php
|___Models
|___Tests
```
The structure above is logic-driven rather than data-driven. This means our modules group related functionality together, which all operate against an omnipresent data layer surrounding them

Don't fret about what the purpose of the files you aren't familiar with is. Soon enough, you will get to understand them in depth, enough to restructure it to more exquisite tastes.

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

Congratulations? Well, not really. We were wrong to have verified a successful request through our browser. Now, let's do this again; this time, properly

Navigate to [[the test class]]. Paste the following test in it

// test

Run this in the terminal
// use same link as above

And, voila! We have a reproducible, irrefutable confirmation that our very first endpoint passes in flying colors. Now, we are ready for the serious business -- because, in our hands lies the power to build the **next big thing.** All that is left is for us to delve deeper into getting a better understanding of the possibilities we can accomplish with Suphle

You can either take things easy, [sequentially](/docs/v1/modules) getting your feet wet. Or, you can hop right over to [routing](/docs/v1/routing) which we just perused.

Have a jolly ride.