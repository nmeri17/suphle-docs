## Requirements
- PHP 7.4+
- Composer

## Installation
Hurry to your CLI and run

```bash
composer require nmeri17/suphle
```

Afterwards, initialize your project with

```bash
php suphle create-project --m Main
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

((merge with below))
Optionally, ...

## Anatomy of a Suphle module

![suphle-module](/suphle-module.jpeg)

The illustration above is a bird's eye-view of each module's ultimate structure, which can be imagined as a link to other modules with similar structure. They ultimately converge at your [app's entry point](/docs/v1/modules#app-entry-point), where you will have mechanisms that act as glue to hold them all together. The segments which a user's request cuts through are the ones you are ~~likely~~ expected to change frequently -- otherwise called "moving parts". They are the ones we want to get right in a way that allows them remain elegant both after modification.

## Request lifecycle

Though not compulsory, it's strongly recommended to compartmentalize your app into [modules](/docs/v1/modules). Modules exist independently, which means they tend to contain their own routes and exist in a state where they can be deployed without knowledge of their sibling modules' internal details.

For every request received by your app, it's apportioned to its appropriate handler before being passed onto a module where applicable.

Suphle has 3 different kinds of request, which are in turn, subdivided into their subcategories:
- [Login requests](/docs/v1/authentication)
- [Flow requests](/docs/v1/flows)
- [Regular requests](/docs/v1/controllers)

When framework deciphers incoming request is a regular one, it cycles from module to module. First, each module is booted into an intermediary state from which its autonomous router can be queried for a match against incoming request. The *booting* generally involves preliminary activities such as [object binding](/docs/v1/container#contextual-binding) required to identify matching requests.

When a module informs Suphle about its ability to handle request, the rest of the module is initialized e.g. [event listeners](/docs/v1/events#listeners) are mounted. The purpose of personalizing internal objects before routing commences is they are all expected to *not* know about context of other modules.

After initialization completes, authentication, authorization and validation checks are performed. If they all succeed, a [middleware](/docs/v1/middleware) stack is assembled, to convene and decide whether they will rather handle request, or delegate to whatever handler is designated in their module's router. With their permission, request can then reach your controllers, and compute a response data which is forwarded to the renderer assigned in the router.

This is usually the last stage for requests before they get flushed to the client.

Quite an adventure, you'd say. Now, we'll be accompanying the request to all the landmarks described here. We'll first study modules as it happens to be the umbrella under which all the components we are interested in reside.