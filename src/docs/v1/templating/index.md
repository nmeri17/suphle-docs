## Introduction

This chapter relates to conventions and configurations for objects that enable [coordinator result](/docs/v1/service-coordinator#Creating-a-service-coordinator) to be parsed against a series of relevant files, into HTML content for a browser response or HTML mail. If you're not seeking to delve into the nitty-gritty of what makes this [renderer type](/docs/v1/routing#Markup-renderer) tick, the summary is that the default adapter is powered by Blade, assisted by a plugin for facilitating the use of Turbo Hotwire.

### Settling for Blade

PHP originally being a templating language means there's no shortage of SSR templating libraries. Among this list includes a certain Transphporm project whose ideology revolves around full separation of markup from content parsing or binding. It doesn't introduce a new template language, but uses the CSS syntax every web developer is already familiar with. Aside the theoretic advantage that this presents, it would both result in far more elegant templates, and obviate the quest for a full-stack developer with strong UI chops. Since the markups don't mangle arcane escape tags, they can directly be edited by the designer, at will.

These should have been every back-end developer's dream come true, but for reasons best known to the community, they were not convincing enough to gain it traction. Thus, its maintainers abandoned it.

Examining online polls will reveal that PHP templating preference leverages the popularity of each library's parent framework. Thus, the dichotomy is shared between Twig, Blade, and others. Suphle's `Markup` renderer computes HTML content using a Blade adapter, for the following reasons:

- It doesn't deviate too far from PHP syntax itself, thus requiring a low barrier both for entry and while transitioning between code and template.

- It has a [Components](https://laravel.com/docs/9.x/blade#components) feature that, on the surface, seems like converting template partials and includes into custom HTML tags. However, the introduction of classes makes a world of difference when considered as a layer strictly for presentation logic, conditionals and formatters.

As with everything in Suphle, there is no vendor lock-in. That is to say, if you are more conversant with some other library replacing this adapter with another connected to your engine of choice is trivial.

## Declaring markup renderers

If you're not already familiar with its syntax, consider perusing [its documentation](https://laravel.com/docs/9.x/blade). Everything applicable there applies here, except method of usage. You will recall that [response renderers](/docs/v1/routing#Default-renderers) are attached to the pattern, rather than the culmination of executing an action handler. Thus, the following declaration,

```php

use Suphle\Response\Format\Markup;

use Suphle\Routing\{BaseCollection, Decorators\HandlingCoordinator};

#[HandlingCoordinator(EntryCoordinator::class)]
class CarRoutes extends BaseCollection {
	
	public function SALES() {
		
		$this->_httpGet(new Markup("salesHandler", "show-sales"));
	}
}
```

Is equivalent to using the `view` function you're accustomed to in Blade.

### Binding blade component classes

The Blade parser makes use of the `Suphle\Adapters\Presentation\Blade\DefaultBladeAdapter` adapter, which makes provision for binding markup tags, as well as component namespaces using its `bindComponentTags` method.

```php

use Suphle\Adapters\Presentation\Blade\DefaultBladeAdapter;

class CustomBladeAdapter extends DefaultBladeAdapter {
	
	public function bindComponentTags ():void {
		
		$this->bladeCompiler->component("tag-name", SectionComponent::class); // or

		$this->bladeCompiler->componentNamespace(

			"AllModules\\ModuleOne\\BladeComponents", "project-name"
		); // if it's more convenient to do at a go
	}
}
```

These bindings are then used in the templates as follows, respectively:

```html

<x-tag-name/>

<x-project-name::tag-name /> <!-- Reads the tag names automatically on your behalf -->
```

`CustomBladeAdapter` must then be bound to the `HtmlParser` interface [replacing](/docs/v1/container#Binding-regular-interfaces) `DefaultBladeAdapter`.

## Configuring a presentation adapter

The `Markup` renderer doesn't directly utilize the connected presentation adapter. It actually extends the `Suphle\Response\Format\BaseHtmlRenderer` abstract class, along with its sister renderers who similarly output HTML content -- the upside of doing so being that the underlying adapter powering the parsing can be replaced without affecting the high-level renderers themselves. The only time it's necessary to roll out custom renderers is when the constructor of the defaults don't collect sufficient arguments required by the templating library to function properly.

`BaseHtmlRenderer` in turn, relies on the `Suphle\Contracts\Presentation\HtmlParser` interface for offering a uniform platform for communicating with diverse adapters. In order to replace it, [connect your](/docs/v1/container#Providing-interfaces) adapter to a custom implementation of the `HtmlParser` interface as required.

## Micro front-ends

This concept is a subsidiary of a broader one identified as *view composition*. Its use is only necessitated in architectures such as ours with polarized compartments. Since markup templates cannot be extended (in the sense of namespaced classes), and should not be duplicated, the logical solution would be delegating visual structure of the data to the module it's generated from. This method is recommended, as opposed to pulling autonomous visual snippets responsible for their data, links, client-side behaviour, and styling from diverse sources by the eventual consumer. Rather, all that pertains to those data should be parsed by the relevant compartment, using their raw HTML to constitute the larger context.

In order to produce HTML content, the parser has to be invoked without the renderer wrappers.

```php

use Suphle\Contracts\Presentation\HtmlParser;

class ModuleApi implements ModuleOne {

	public function __construct (

		private readonly ProductsService $productsService,

		private readonly HtmlParser $htmlParser
	) {

		//
	}

	public function productListWithView ():string {

		return $this->htmlParser->parseRaw(

			"partials/product-grid",

			$this->productsService->recommendedProducts()
		);
	}
}
```

Bear in mind that the `parseRaw` is adapter-specific since it's impossible for all templating engines to require the same argument list. In the case of Blade, the template name and an iterable payload suffices.

## Optimising fidelity to web app status

Nowadays, it's prevalent among web users and developers that projects or applications with full page reloads are archaic and reminiscient of the web pages of the early days. Thus, new projects are not considered presentable without layering one of the 3/4 front end frameworks, reducing the back end to a mere custodian of the API feeding data to the client.

These client sides replicate the routing, validation, authentication, virtually most operations both safer to perform at the back end, and that are there already. The front-end was originally intended, and should only be burdened with presentation: UI and UX. Thankfully, recent times have seen a rise in HTML-over-the-wire libraries. With these in place:

1. Application logic and data continue to be dictated by the back-end, without duplication across both sides of the divide.

1. Since content is rendered at the back end, we don't have to forfeit SEO in exchange of the modern feel of using an SPA.

1. Drastic cut down in development complexity, delivery ETA, team size, etc.

1. No data binding boilerplate.

The high-fidelity front-end is then used for creating palatable interfaces as well as fancy animation, not dabbling in business logic. If you've not used any of them before, juggling too many new concepts can make hitting the ground running daunting. Thus, Suphle beginners are encouraged to initialize their presentation layers with whatever SSR adapter is connected. Incremental enhancement of sections of their template markups can be carried out bit by bit.

The choice of which of the HTML-over-the-wire libraries to go with is up to you. Suphle comes with a component for facilitating work with [Hotwire](https://turbo.hotwired.dev/) for the following reasons:

- It's strongly pushed forward by the maintainers of the Rails framework.

- Handles page transitions and content include animation for you.

- Takes form submissions into account.

- Web-socket support.

- Clients written with it can be reused on mobile applications.

- Includes support for [preloading URIs](https://turbo.Hotwired.dev/handbook/drive#preload-links-into-the-cache). While this may seem redundant where already Suphle makes provision for [Flows](/docs/v1/flows), both are actually complementary in the sense that static urls are preloaded while dynamic one use Flows.

If you're more conversant with another library, any component that can be written to facilitating work with it in Suphle is welcome.

## Hotwire rundown

Hotwire introduces some new HTML tags with which to wrap your markup in. These tags and their attributes will determine, primarily, target selector to replace, what replacement mode to use, and other peripheral directives such as transition style.

The one thing all HTML-over-the-wire libraries have in common is intercepting requests to inbound URIs and rendering the content without a full page reload. Hotwire does this using [Turbo drive](https://turbo.hotwire.dev/handbook/drive).

A more complicated requirement is receiving and replacing sections of existing markup in response to actions triggered on the client side. For these, [Turbo frames](https://turbo.hotwire.dev/handbook/frames) are used. It's fairly easy to get used to once you get the hang of sending page fragments with a DOM ID matching the portion of existing/originating page we intend to replace. Your server-side still behave as usual, although if resources permit, it's more optimal for just the updated sections to be returned rather than a complete page response from which Hotwire will filter.

Turbo frame is a drop-in replacement for all the times you've had to have a front end SDK fetching data from an API into a store and then component properties and methods for binding them to the DOM. For every DIV or container you previously pegged such data, just wrap it in a Frame tag – pagination containers, product lists, etc.

Finally, [Turbo streams](https://turbo.hotwire.dev/handbook/streams) are used to update multiple sections of the page simultaneously. It's just like Frames but multiple Streams can be returned in one response. Its behavior can equally diversify based on context. For this reason, Suphle's Hotwire integration is almost entirely dedicated to working with Turbo streams.

Partials/Hotwire frames should only be returned for actions. Links should render full page markup so your title bar can reflect the change in navigation as well as SEO content update.

If you'd prefer a primer containing infographics, you may find [this resource](https://boringrails.com/articles/thinking-in-hotwire-progressive-enhancement/) entertaining.

### Hotwire form submissions

Since the method of feedback deviates from the norm, Suphle demands to be informed beforehand about the new response types and how to deal with them. Some helpful tips can be found [here](https://turbo.hotwired.dev/handbook/drive#form-submissions) for application on the client-side. On the back-end, the `Suphle\Contracts\Response\RendererManager` interface must [be bound](/docs/v1/container#Binding-regular-interfaces) to `Suphle\Adapters\Presentation\Hotwire\HotwireRendererManager`. This manager obscures away validation and execution headaches away from you i.e. no conditionals per action handler.

In addition, some new renderers are introduced to differentiate between regular intent and a static page update, namely:

- `Suphle\Adapters\Presentation\Hotwire\Formats\RedirectHotwireStream`, and
- `Suphle\Adapters\Presentation\Hotwire\Formats\ReloadHotwireStream`

When a non-Hotwire request is received, these renderers will respond with the underlying renderer's default behavior. However, when request originates from a Hotwire-controlled element, each action handler is validated, executed, parsed, and wrapped in a Turbo stream.

Suppose our route collection starts out with the following renderer binding:

```php

use Suphle\Routing\BaseCollection;

use Suphle\Response\Format\{Redirect, Markup};

use Suphle\Tests\Mocks\Modules\ModuleOne\Coordinators\FormHandlingCoordinator;

#[HandlingCoordinator(FormHandlingCoordinator::class)]
class FormHandlingCollection extends BaseCollection {

	public function INIT__POSTh () {

		$this->_httpGet(new Markup("loadForm", "secure-some/edit-form"));
	}

	public function HANDLE__FORMh () {

		$this->_httpPost(new RedirectHotwireStream("executeForm", fn () => "/"));
	}
}
```

The application redirects to the stipulated location on form handling success. Since Turbo streams potentially update multiple parts of the page, we need a renderer that receives multiple action handlers. Replacing `Redirect` with its Hotwire equivalent, we have:

```php

use Suphle\Exception\Diffusers\ValidationFailureDiffuser;

use Suphle\Adapters\Presentation\Hotwire\Formats\RedirectHotwireStream;

use Suphle\Adapters\Orms\Eloquent\Models\ModelDetail;

#[HandlingCoordinator(FormHandlingCoordinator::class)]
class FormHandlingCollection extends BaseCollection {

	public function INIT__POSTh () {

		$this->_httpGet(new Markup("loadForm", "secure-some/edit-form"));
	}

	public function HANDLE__FORMh () {

		$renderer = (new RedirectHotwireStream("hotwireFormResponse", fn () => "/"))

		->addReplace(
			"hotwireReplace", "#replace-form",

			"hotwire/form-fragment"
		)
		->addBefore(
			"hotwireBefore", $this->getStreamActionTarget(),

			"hotwire/new-content-fragment"
		);

		$this->_httpPost($renderer);
	}

	public function getStreamActionTarget (string $formTarget = "#replace-form"):callable {

		return function () use ($formTarget) {

			$responseBody = $this->rawResponse;

			if (!array_key_exists(ValidationFailureDiffuser::ERRORS_PRESENCE, $responseBody))

				return "#". (new ModelDetail)

				->idFromModel($responseBody["data"]);

			return $formTarget;
		};
	}
}
```

`RedirectHotwireStream` receives the same arguments as its native counterpart. However, a fluent interface builder is returned in conformity with the [various directives](https://turbo.hotwire.dev/handbook/streams#but-what-about-running-javascript). All directive methods, with the exception of `addRemove`, receive an action handler, a target ID to influence, and a template name to run the action handler's contents against.

The following builder methods exist: `addReplace`, `addUpdate`, `addAppend`, `addPrepend`, `addAfter`, `addBefore`, and `addRemove`. Since the `remove` directive omits content, `addRemove` doesn't accept a template name.

```php

public function DELETE__SINGLEh () {

	$renderer = (new RedirectHotwireStream("hotwireFormResponse", fn () => "/"))

	->addRemove(
		"hotwireDelete", $this->getStreamActionTarget()
	);

	$this->_httpDelete($renderer);
}
```

Among all evaluated directives, should any of their validation rules fail, execution will be terminated and validation exception handling will kick in.

Turbo tag targets are necessary since incoming element needs a way to reference the DOM element it seeks to replace. In the examples above, the `getStreamActionTarget` method is used to generate the `targets` attribute of the `<turbo-stream>` tag. It checks for the presence of the validation diffuser on the given payload: Where present, the `#replace-form` selector is used as target i.e. validation errors replace the element matching that selector. Where execution completed successfully, a tag ID is generated from the model modified by the action handler.

```php

class FormHandlingCoordinator extends ServiceCoordinator {

	public function hotwireReplace (BaseProductBuilder $builtProduct):iterable {

		return [

			"data" => $this->productsService->updateResource($builtProduct)
		];
	}
}
```

The `ModelDetail::idFromModel` convenience method is used to generate a unique ID matching the pattern `model_name_id`. As can be seen from its namespace, it's coupled to Eloquent's ORM. Thus, endeavor to use one applicable to your ORM adapter if a different one is in use. The `idFromModel` method takes an optional 3rd argument for defining a prefix to attach to the generated string.

```php

"." . (new ModelDetail)->idFromModel($responseBody["data"], "comments");
```

When a post is returned by the action handler, `idFromModel` will generate a selector string like `"comments_post_13"`.

### Hotwire validation conventions

The renderers listed above are expected to be used in response to actions originating from the front-end. Mutative actions can potentially fail their validation. When this occurs, since there are no full page reloads, the Hotwire client can't be instructed to redirect in the traditional manner. It'll be inconvenient for each renderer to specify what partial to fallback to, thus the Hotwire component introduces failure conventions.

Validation failure conventions are used to determine what partials to render in the event of validation failure. They are all expected to implement the `Suphle\Contracts\Requests\ValidationFailureConvention` interface.

```php

use Suphle\Contracts\Presentation\BaseRenderer;

use Suphle\Adapters\Presentation\Hotwire\Formats\BaseHotwireStream;

interface ValidationFailureConvention {

		public function deriveFormPartial (

			BaseHotwireStream $renderer, array $failureDetails
		):BaseRenderer;
	}
```

The default convention, aptly called `HttpMethodValidationConvention`, will surmise which of the nodes on the previous renderer contains the originating form by taking a hint from request's HTTP method. It operates under the assumption that the form is returned regardless of the processing outcome.

Let's revisit the `FormHandlingCollection::HANDLE__FORMh` method:

```php

#[HandlingCoordinator(FormHandlingCoordinator::class)]
class FormHandlingCollection extends BaseCollection {

	public function HANDLE__FORMh () {

		$renderer = (new RedirectHotwireStream("hotwireFormResponse", fn () => "/"))

		->addReplace(
			"hotwireReplace", "#replace-form",

			"hotwire/form-fragment"
		)
		->addBefore(
			"hotwireBefore", $this->getStreamActionTarget(),

			"hotwire/new-content-fragment"
		);

		$this->_httpPost($renderer);
	}
}
```

On successfull execution, this renderer replaces the filled form with empty fields and sets the new content just before it. The essence of using a `replace` node over a `remove` one is that on validation failure, defaulting fields can be populated along with incoming input and rendered to the user.

Suppose the originating page includes the form partial, amongst other content:

```html
<!-- secure-some/edit-form.blade.php -->
...

@include("hotwire/form-fragment.blade.php")

...
```

```html

<!-- form-fragment.blade.php -->
<form id="replace-form">
	<input type="text" name="id" value="@isset($payload_storage){{$payload_storage['id']}}@endisset">
</form>

@isset($validation_errors)
	<div id="validation-errors">
		<h3>Validation errors</h3>

		<ul>
			@foreach($validation_errors as $key => $error)

				<li class="error">

					{{$key . ":". implode("\n", $error)}}
				</li>
			@endforeach
		</ul>
	</div>
@endisset
```

Data fields `validation_errors` and `payload_storage` are added for you while handling this exception.

We will continue to render `"hotwire/form-fragment"` with validation errors until it passes. The form is then emptied and `"hotwire/new-content-fragment"` is streamed in addition.

As was mentioned earlier, `HttpMethodValidationConvention` decides which node to return on failure by reading incoming HTTP request method. `POST` requests are more likely to replace entire forms. Other mutative request methods will possibly originate from single UI elements, thereby making the `update` action more suitable. Thus, any partial on an `addUpdate` node will be used.

```php
public function HOTWIRE__RELOADh () {

	$renderer = (new ReloadHotwireStream("hotwireFormResponse"))

	->addAfter(
		"hotwireAfter", $this->getStreamActionTarget(),

		"hotwire/new-content-fragment"
	)
	->addUpdate(
		"hotwireUpdate", "#update-form",

		"hotwire/update-fragment"
	);

	$this->_httpPut($renderer);
}
```

Above, a `PUT` request is sent. On validation failure, all other nodes on the `ReloadHotwireStream` renderer are discarded, returning just `"hotwire/update-fragment"`.

Whereby the expected node is absent, the renderer will respond with all nodes attached to it, binding the same payload and errors combination as their action handler result. If this behavior is not desirable, [replace this interface](/docs/v1/container#Binding-regular-interfaces) with an implementation more appropriate for your use case.

### Hotwire authentication failure

As was discussed in the [login mediators](/docs/v1/authentication#Login-mediators) section, mediators are used to connect to login services that eventually return what renderers to respond with. While optimizing with Hotwire fragments, remember to replace the default browser-based mediator with a custom one pointing to a service that returns one of the renderers discussed above, especially, for the `failedRenderer` method.

## Connecting the broadcaster

One other tag Hotwire introduces is the `turbo-stream-source` for creating persistent connections for creating one-way connections to streamable URI sources such as those provided by web-sockets and server-sent events.

Streamable URI sources are updates that should be seen by all connected clients. They are publications in response to the change in state of some vector observed by one or more clients. Such changes can either be orchestrated by the regular HTTP request of one user (for e.g. new status of a database model during that request handling), a client-only action, or in response to a 3rd-party subject. Since web-socket us mainly for transmitting data back and forth clients, if a client originated action is expected to mutate the database in-between that flow, a regular AJAX request should be sent to the server.

The `turbo-stream-source` tag requires a `src` attribute for defining the target URI source. Fortunately, the Roadrunner load-balancer that powers Suphle [application servers](/docs/v1/application-server) is equipped with a plugin for spinning up web-socket servers. To connect it, you have to start by including its entries in your server config yaml file. The reference config includes the following settings:

```yaml
# Websockets plugin
#
# Should be attached as a middleware to the http plugin middlewares
websockets:
  # Broker to use. Brokers can be set in the broadcast plugin. For example, if you use broker: default here, broadcast plugin should have default broker in its config.
  #
  # This option is required.
  broker: default-redis

  # Allowed request origin (single value). This option is optional (allowed all by default)
  #
  # Default: "*". Samples: "https://*.my.site", "http//*.com", "10.1.1.1", etc
  allowed_origin: "*"

  # http path where to handle websockets connections
  #
  # Default: /ws
  path: "/ws"

# Broadcast plugin. It main purpose is to broadcast published messages via all brokers
#
# Use it in conjunction with the websockets, memory and redis plugins.
# LIMITATION: DO NOT use the same redis connection within different sections or messages will be duplicated.
# There is no limitation to use different redis connections (ie localhost:6379, localhost:6378, etc) in different sections.
broadcast:
  # Section name.
  #
  # This option is required and should match with other plugins broker section.
  default:
    # Driver to use. Available drivers: redis, memory. In-memory driver does not require any configuration.
    #
    # This option is required. There is no config for this driver for the broadcast, thus we need to use {}
    driver: memory
    # This option is required if you want to use local configuration
    #
    # Default: empty.
    config: { }

  # Section name.
  #
  # This option is required and should match with other plugins broker section.
  default-redis:
    # Driver to use. Available drivers: redis, memory. Redis driver require configuration (if empty - localhost:6379 one-node client will be used, see redis plugin config).
    #
    # This option is required.
    driver: redis
    # Local configuration section
    #
    # This option is required to use local section, otherwise (default-redis) global configuration will be used.
    config:
      # Redis configuration. This configuration related to the default-redis section. Broadcast plugin will use this configuration first.
      # If section configuration doesn't exists, second priority - global redis configuration.
      # If there are no configurations provided, default will be used.
      #
      # Default: localhost:6379
      addrs:
        - "localhost:6379"
      # if a MasterName is passed a sentinel-backed FailoverClient will be returned
      master_name: ""
      username: ""
      password: ""
      db: 0
      sentinel_password: ""
      route_by_latency: false
      route_randomly: false
      dial_timeout: 0 # accepted values [1s, 5m, 3h]
      max_retries: 1
      min_retry_backoff: 0 # accepted values [1s, 5m, 3h]
      max_retry_backoff: 0 # accepted values [1s, 5m, 3h]
      pool_size: 0
      min_idle_conns: 0
      max_conn_age: 0 # accepted values [1s, 5m, 3h]
      read_timeout: 0 # accepted values [1s, 5m, 3h]
      write_timeout: 0 # accepted values [1s, 5m, 3h]
      pool_timeout: 0 # accepted values [1s, 5m, 3h]
      idle_timeout: 0 # accepted values [1s, 5m, 3h]
      idle_check_freq: 0 # accepted values [1s, 5m, 3h]
      read_only: false

```

You can then tweak it to fit your needs. You can see the `websockets.path` source required by your `turbo-stream-source` tag. After a connection is established, the Suphle code should prepare to respond to web-socket messages. The authors of Roadrunner provide a library for this purpose, that can be installed like so:

```bash

composer require spiral/roadrunner-broadcast
```

Its documentation and usage reside at its [Github repository](https://github.com/spiral/roadrunner-broadcast).

## Testing

Markups are not tested standalone. Rather, their output from a HTTP request is what is tested. The response asserter returned from HTTP-based tests has methods in the `assertSee` family covering basic presentation assertions.

```php

class BasicTemplateTest extends ModuleLevelTest {

	public function test_failed_validation_always_reverts_errors_to_previous_on_browser () {

		$this->get("/get-without"); // given

		$response = $this->post("/post-with-html", $this->csrfField); // when

		// then
		$response->assertUnprocessable()

		->assertSee("Edit form");
	}
}
``` 

As already explained in the Appendix chapter regarding what [aspects of the software constitute meaningful tests](/docs/v1/appendix/What-to-test), you can only go so far with verifying DOM elements. However, if you insist, you may be better served by installing [a package](https://github.com/nunomaduro/laravel-mojito) that provides greater verification functionality for Blade templates.

```bash

composer require --dev nunomaduro/laravel-mojito
```

The library contains methods closer to fine-grained CSS selectors, for example `empty`, `hasAttribute`, `hasMeta`, etc.
