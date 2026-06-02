## Introduction

This chapter relates to conventions and configurations for objects that enable [coordinator result](/docs/v2/service-coordinators#Creating-a-service-coordinator) to be parsed against a series of relevant files, into HTML content for a browser response or HTML mail. If you're not seeking to delve into the nitty-gritty of what makes this [renderer type](/docs/v2/routing#Markup-renderer) tick, the summary is that the default adapter is powered by Blade, assisted by a plugin for facilitating the use of Turbo Hotwire.

### Settling for Blade

PHP originally being a templating language means there's no shortage of SSR templating libraries. Among this list includes a certain Transphporm project whose ideology revolves around full separation of markup from content parsing or binding. It doesn't introduce a new template language, but uses the CSS syntax every web developer is already familiar with. Aside the theoretic advantage that this presents, it would both result in far more elegant templates, and obviate the quest for a full-stack developer with strong UI chops. Since the markups don't mangle arcane escape tags, they can directly be edited by the designer, at will.

These should have been every back-end developer's dream come true, but for reasons best known to the community, they were not convincing enough to gain it traction. Thus, its maintainers abandoned it.

Examining online polls will reveal that PHP templating preference leverages the popularity of each library's parent framework. Thus, the dichotomy is shared between Twig, Blade, and others. Suphle's `Markup` renderer computes HTML content using a Blade adapter, for the following reasons:

- It doesn't deviate too far from PHP syntax itself, thus requiring a low barrier both for entry and while transitioning between code and template.

- It has a [Components](https://laravel.com/docs/9.x/blade#components) feature that, on the surface, seems like converting template partials and includes into custom HTML tags. However, the introduction of classes makes a world of difference when considered as a layer strictly for presentation logic, conditionals and formatters.

As with everything in Suphle, there is no vendor lock-in. That is to say, if you are more conversant with some other library replacing this adapter with another connected to your engine of choice is trivial.

## Declaring markup renderers

If you're not already familiar with its syntax, consider perusing [its documentation](https://laravel.com/docs/9.x/blade). Everything applicable there applies here, except method of usage. You will recall that [response renderers](/docs/v2/routing#Default-renderers) are returned directly from coordinator methods, rather than being attached to route patterns. Thus, the following declaration,

```php
use Suphle\Response\Format\Markup;
use Suphle\Routing\Attributes\{Route, HttpMethod};

class CarCoordinator
{
    #[Route("sales", HttpMethod::GET)]
    public function salesHandler(): Markup
    {
        return new Markup("show-sales", [
            'data' => $this->salesService->getData()
        ]);
    }
}
```

Is equivalent to using the `view` function you're accustomed to in Blade.

### Binding blade component classes

While working with Blade's component classes, we will want to bind markup tags to our view files, or bind component namespaces to our layout classes. These bindings are expected to take place in a properly connected `DefaultBladeAdapter::bindComponentTags` method.

A descendant of this class is already connected for you in the starter project. It can be modified to accomodate your desired bindings as follows:

```php

namespace AllModules\CompanySymbol\Config;

use Suphle\Adapters\Presentation\Blade\DefaultBladeAdapter;

use AllModules\CompanySymbol\Markup\Components\AppLayouts;

class CustomBladeAdapter extends DefaultBladeAdapter {
	
	public function bindComponentTags ():void {
		
		$this->bladeCompiler->component("tag-name", SectionComponent::class); // or

		$this->bladeCompiler->componentNamespace(

			"AllModules\\ModuleOne\\BladeComponents", "project-name"
		); // if it's more convenient to do at a go
	}
}
```

These bindings are then used in the view templates:

```html

<x-tag-name/>

<x-project-name::tag-name /> <!-- Reads the tag names automatically on your behalf -->
```

## Configuring a presentation adapter

The `Markup` renderer doesn't directly utilize the connected presentation adapter. It actually extends the `Suphle\Response\Format\BaseHtmlRenderer` abstract class, along with its sister renderers who similarly output HTML content -- the upside of doing so being that the underlying adapter powering the parsing can be replaced without affecting the high-level renderers themselves. The only time it's necessary to roll out custom renderers is when the constructor of the defaults don't collect sufficient arguments required by the templating library to function properly.

`BaseHtmlRenderer` in turn, relies on the `Suphle\Contracts\Presentation\HtmlParser` interface for offering a uniform platform for communicating with diverse adapters. In order to replace it, [connect your](/docs/v2/container#Providing-interfaces) adapter to a custom implementation of the `HtmlParser` interface as required.

---

## Micro front-ends

This concept is a subsidiary of a broader one identified as *view composition*. Its use is only necessitated in architectures such as ours with polarized compartments. Since markup templates cannot be extended (in the sense of namespaced classes), and should not be duplicated, the logical solution would be delegating visual structure of the data to the module it's generated from. This method is recommended, as opposed to pulling autonomous visual snippets responsible for their data, links, client-side behaviour, and styling from diverse sources by the eventual consumer. Rather, all that pertains to those data should be parsed by the relevant compartment, using their raw HTML to constitute the larger context.

In order to produce HTML content, the parser has to be invoked without the renderer wrappers.

```php
use Suphle\Contracts\Presentation\HtmlParser;

class ModuleApi implements ModuleOne {

    public function __construct (
        private readonly ProductsService $productsService,
        private readonly HtmlParser $htmlParser
    ) {}

    public function productListWithView ():string {
        return $this->htmlParser->parseRaw(
            "partials/product-grid",
            $this->productsService->recommendedProducts()
        );
    }
}

```

Bear in mind that the `parseRaw` method above, is adapter-specific (in this case, to the Blade adapter), since it's impossible for all templating engines to require the same argument list. In the case of Blade, the template name and an iterable payload suffices.

---

## Optimising fidelity to web app status

Nowadays, it's prevalent among web users and developers that projects or applications with full page reloads are archaic and reminiscent of the web pages of the early days. Thus, new projects are not considered presentable without layering one of the 3/4 front end frameworks, reducing the back end to a mere custodian of the API feeding data to the client.

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

- Includes support for [preloading URIs](https://turbo.Hotwired.dev/handbook/drive#preload-links-into-the-cache). While this may seem redundant where already Suphle makes provision for [Flows](/docs/v2/flows), both are actually complementary in the sense that static urls are preloaded while dynamic one use Flows.

If you're more conversant with another library, any component that can be written to facilitating work with it in Suphle is welcome.

## Hotwire rundown

Hotwire introduces some new HTML tags with which to wrap your markup in. These tags and their attributes will determine, primarily, target selector to replace, what replacement mode to use, and other peripheral directives such as transition style.

The one thing all HTML-over-the-wire libraries have in common is intercepting requests to inbound URIs and rendering the content without a full page reload. Hotwire does this using [Turbo drive](https://turbo.hotwire.dev/handbook/drive).

A more complicated requirement is receiving and replacing sections of existing markup in response to actions triggered on the client side. For these, [Turbo frames](https://turbo.hotwire.dev/handbook/frames) are used. It's fairly easy to get used to once you get the hang of sending page fragments with a DOM ID matching the portion of existing/originating page we intend to replace. Your server-side still behave as usual, although if resources permit, it's more optimal for just the updated sections to be returned rather than a complete page response from which Hotwire will filter.

Turbo frame is a drop-in replacement for all the times you've had to have a front end SDK fetching data from an API into a store and then component properties and methods for binding them to the DOM. For every DIV or container you previously pegged such data, just wrap it in a Frame tag – pagination containers, product lists, etc.

Finally, [Turbo streams](https://turbo.hotwire.dev/handbook/streams) are used to update multiple sections of the page simultaneously. It's just like Frames but multiple Streams can be returned in one response. Its behavior can equally diversify based on context. For this reason, Suphle's Hotwire integration is almost entirely dedicated to working with Turbo streams.

Partials/Hotwire frames should only be returned for actions. Links should render full page markup so your title bar can reflect the change in navigation as well as SEO content update.

If you'd prefer a primer containing infographics, you may find [this resource](https://boringrails.com/articles/thinking-in-hotwire-progressive-enhancement/) entertaining.

---

### The Paradigm Shift: Controllers as View-Models

When entering the territory of Turbo Streams, the architectural role of your backend shifts. Instead of thinking of your controller as a simple HTTP traffic cop that returns static content or JSON data, you are orchestrating the visual layout of the page directly from the server.

This completely eliminates client-side state managers (like Redux, Vuex, or Pinia), frontend API abstraction layers, and data-binding boilerplate. However, because you are binding backend logic directly to DOM interactions, an average controller method can quickly become rowdy.

To maintain Suphle's strict code-separation principles and prevent controllers from becoming cluttered, you should treat your actions as **View-Models**. Furthermore, you are strongly encouraged to adopt **Single-Action Controllers** (where an entire class manages a single route action) rather than standard multi-method controllers. This allows dependencies to remain isolated, ensuring your visual lifecycle configurations are clean and readable at a glance. Views must also be re-imagined: no longer read as massive monolithic templates, but rather as tiny, bite-sized modular partials.

---

### Hotwire form submissions & Service Proxies

Since the method of feedback deviates from the norm, Suphle demands to be informed beforehand about the new response types and how to deal with them. Some helpful tips can be found [here](https://turbo.hotwired.dev/handbook/drive#form-submissions) for application on the client-side. On the back-end, the `Suphle\Contracts\Response\RendererManager` interface must [be bound](/docs/v2/container#Binding-regular-interfaces) to `Suphle\Adapters\Presentation\Hotwire\HotwireRendererManager`. This manager completely abstracts away validation and execution complexities from your active pipeline—eliminating conditional branching inside individual action handlers.

In addition, some new renderers are introduced to differentiate between regular intent and a static page update, namely:

- `Suphle\Adapters\Presentation\Hotwire\Formats\RedirectHotwireStream`, and
- `Suphle\Adapters\Presentation\Hotwire\Formats\ReloadHotwireStream`

When a non-Hotwire request is received, these renderers gracefully drop back to the underlying renderer's default behavior (such as a standard HTTP 303 Redirect or full page reload). However, when a request originates from a Hotwire-controlled element, each action handler is validated, executed, parsed, and wrapped in a Turbo stream element.

#### Understanding the Stream Lifecycle: Mutation vs. Fetching

In a realistic Turbo Stream architecture, your response payload is often a combined composition of actions. Typically, a single form submission orchestrates **one primary mutative database action** (e.g., updating a model) followed by **multiple read/fetch operations** to generate secondary UI update fragments (e.g., retrieving a fresh sidebar element or recalculating counter states).

Because Suphle enforces strict framework-level contract methods on intercepted mutative services, your database changes *must* run through a transaction block. However, to guarantee absolute resilience across your entire Hotwire response stream, **the entire service class is wrapped in a dynamic proxy instance** via an interception decorator, using either `#[InterceptsCalls(SystemModelEdit::class)]` or `#[InterceptsCalls(MultiUserModelEdit::class)]`.

Since both mutative contracts natively extend `ServiceErrorCatcher`, this dual-layer proxy network executes as follows:

1. **The Mutation Layer**: Invoking the strict contract method (`updateModels` for `SystemModelEdit` or `updateResource` for `MultiUserModelEdit`) triggers automated database transactions along with their respective concurrency controls, such as manual active row-locking or automated stale-copy integrity checks.
1. **The Crash Protection Layer**: Invoking secondary custom fetch methods (like `fetchSidebarState()`) bypasses the underlying transaction and modification hooks, but remains protected within the proxy safety net. If an unhandled error or data corruption happens inside a secondary layout chunk, the exception is caught and diffused gracefully—preventing a sub-element rendering bug from crashing the primary HTTP stream response.

#### Fluent Directive Registration via Callables

All stream modifier methods—`addReplace`, `addUpdate`, `addAppend`, `addPrepend`, `addAfter`, and `addBefore`—expose a fluent builder interface matching the following signature:

```php
public function addAfter(iterable $data, callable $target, string $markupName): self

```

The target element identifier cannot always be predetermined on the server until the action method executes (e.g., when updating a specific item inside an active list). Therefore, the second parameter is a `$target` callable that dynamically yields the CSS selector string.

Suppose we have a single-action coordinator handling a product form submission:

```php
use Suphle\Routing\Attributes\{Route, HttpMethod, RoutePrefix};
use Suphle\Services\{BaseCoordinator, Decorators\ValidationRules};
use Suphle\Adapters\Presentation\Hotwire\Formats\RedirectHotwireStream;
use Suphle\Adapters\Orms\Eloquent\Models\ModelDetail;
use AllModules\ProductModule\{Payloads\ProductBuilder, Services\ProductsService};

#[RoutePrefix("/products")]
class UpdateProductCoordinator extends BaseCoordinator
{
    public function __construct(
        protected readonly ProductsService $productsService
    ) {}

    #[Route("/update", HttpMethod::POST)]
    #[ValidationRules([
        "title" => "required|string|max:150",
        "price" => "required|numeric|min:0"
    ])]
    public function handleForm(ProductBuilder $builder): RedirectHotwireStream
    {
        // Define the fallback redirect for standard web traffic
        $renderer = new RedirectHotwireStream(fn () => "/products");

        return $renderer
            // 1. Primary database mutation via required transaction contract method
            ->addReplace(
                $this->productsService->updateModels($builder),
                fn ($result) => "#form-container",
                "hotwire/form-fragment"
            )
            // 2. Read-only layout component safely guarded against runtime crashes
            ->addBefore(
                $this->productsService->fetchUpdatedNotificationDetails($builder),
                function ($result) {
                    // $result contains whatever data was returned by this node's handler above
                    $modelId = (new ModelDetail)->idFromModel($result["data"]);
                    return "#" . $modelId;
                },
                "hotwire/new-content-fragment"
            );
    }
}

```

The application redirects to the stipulated location on form handling success for a standard browser navigation. However, for a Hotwire-driven execution, Suphle iterates over your registered handlers, processes their outputs, runs them against their companion markup fragments, and outputs combined turbo-streams.

The unique benefit here is complete data visibility: because your `$target` closure receives the evaluated return value of its companion service execution as an input argument, it can inspect that return array or model object to generate deterministic DOM selectors at runtime.

The `addRemove` directive omits markup entirely, hence it excludes the third parameter:

```php
#[Route("delete-single", method: HttpMethod::DELETE)]
#[ValidationRules([
    "id" => "required|numeric"
])]
public function deleteSingle(EmploymentIdBuilder $employmentBuilder): RedirectHotwireStream
{
    return (new RedirectHotwireStream(fn () => "/items"))
        ->addRemove(
            $this->taskService->updateModels($employmentBuilder),
            fn () => "#task_item_" . $employmentBuilder->id
        );
}

```

Among all evaluated directives, should any validation rules fail, execution will be safely terminated before these handlers fire, and validation exception handling conventions will automatically kick in.

The `ModelDetail::idFromModel` convenience method is used to generate a unique ID matching the pattern `model_name_id`. As can be seen from its namespace, it is coupled to Eloquent's ORM. Ensure you use an ID converter applicable to your specific ORM adapter if a different one is in use. The `idFromModel` method takes an optional 3rd argument for defining a prefix to attach to the generated string.

```php
(new ModelDetail)->idFromModel($result["data"], "comments");

```

When a comment model is processed by the action handler, `idFromModel` will generate a selector string like `"comments_comment_13"`.

---

### Hotwire validation conventions

The renderers listed above are expected to be used in response to actions originating from the front-end. Mutative actions can potentially fail their validation. When this occurs, since there are no full-page reloads, the Hotwire client cannot be instructed to redirect in the traditional manner.

To eliminate the need for individual renderers to manually manage error target state variations, the Hotwire component introduces a request-driven validation exception convention managed automatically by the framework.

#### The Request-Driven Target Pattern

Rather than guessing where an error fragment should be injected, the framework inspects the incoming request payload for a specific tracking field: `_turbo_target`.

This permits the front-end components to declare their own isolated update zones explicitly. When a form submission fails validation, the execution pipeline stops early, instantiates a standalone `RedirectHotwireStream`, and generates a single custom stream tag targeting that exact DOM zone:

* **Action:** `replace`
* **Target DOM Selector:** Extracted dynamically from the request payload parameter `_turbo_target` (defaults globally to `#form-container` if absent).
* **Target UI Partial:** `hotwire/form-fragment`

#### Front-End Integration Requirements

Because the target resolution relies on parameters supplied during form submission, your front-end markup must adhere to these structural integration patterns:

1. **Single Form Page (Default Global Mode):**
If a view contains only a single form, you can omit the tracking variable entirely. The manager will default to targeting `#form-container`:

```html
<div id="form-container">
    <form action="/submit-data" method="POST">
        </form>
</div>

```

2. **Multi-Form Pages (Dynamic Targeting Mode):**
If a realistic page contains multiple separate forms (e.g., a "Login" form and a "Newsletter Signup" form inside a side-rail), each form must wrap itself in a uniquely identifiable parent block and convey that specific selector string back using a hidden field named `_turbo_target`:

```html
<div id="login-form-container">
    <form action="/login" method="POST">
        <input type="hidden" name="_turbo_target" value="#login-form-container">
        </form>
</div>

<div id="newsletter-form-container">
    <form action="/subscribe" method="POST">
        <input type="hidden" name="_turbo_target" value="#newsletter-form-container">
        </form>
</div>

```

3. **The Shared Fragment Partial:**
Your application must supply a unified template layout file at `hotwire/form-fragment`. This layout template parses the incoming raw `$failureDetails` payload array—which packages validation error bags paired with stale context values—and outputs the updated form fields complete with contextual error notifications.

If the original incoming request is discovered to be a traditional synchronous non-Hotwire request, this entire stream layout mechanism is ignored, cleanly reverting behavior to trigger a traditional HTTP redirect pointing toward the originating GET form URL using active session tracking history blocks.

#### Context Discarding on Failure

The unique benefit of using a static shared partial format is structural predictability. On successful execution of a registered renderer path, Suphle executes your chain completely. For instance, in our original `UpdateProductCoordinator::handleForm` setup:

```php
return $renderer
    ->addReplace(
        $this->productsService->updateModels($builder),
        fn ($result) => "#form-container",
        "hotwire/form-fragment"
    )
    ->addBefore(
        $this->productsService->fetchUpdatedNotificationDetails($builder),
        fn ($result) => "#product-list",
        "hotwire/new-content-fragment"
    );

```

On success, this renderer returns *both* stream instructions: replacing the filled form with empty fields, and flashing the new content just before the product list container. However, on validation failure, the secondary `addBefore` stream layout and its service invocations are completely discarded. The system shortcuts execution entirely to output only a single `replace` action using `hotwire/form-fragment` targeting either your custom `_turbo_target` or `#form-container`.

This same validation behavior applies across all Hotwire stream formats:

```php
#[Route("reload", HttpMethod::PUT)]
#[ValidationRules([
    "id" => "required"
])]
public function hotwireReload(TaskBuilder $builder): ReloadHotwireStream
{
    return (new ReloadHotwireStream())
        ->addAfter(
            $this->taskService->updateModels($builder),
            fn ($result) => "#activity-log",
            "hotwire/new-content-fragment"
        )
        ->addUpdate(
            $this->taskService->fetchFreshFormState($builder),
            fn ($result) => "#update-form",
            "hotwire/update-fragment"
        );
}

```

Above, a `PUT` request is sent. If validation fails, all normal execution nodes on the `ReloadHotwireStream` object—including both the `addAfter` database log stream and the `addUpdate` form fragment stream layouts—are cleanly scrubbed from output rendering. The request is intercepted by the `HotwireRendererManager`, which constructs an error stream routing back only the universal `hotwire/form-fragment` markup block.

## Connecting the broadcaster

One other tag Hotwire introduces is the `turbo-stream-source` for creating persistent connections for creating one-way connections to streamable URI sources such as those provided by web-sockets and server-sent events.

Streamable URI sources are updates that should be seen by all connected clients. They are publications in response to the change in state of some vector observed by one or more clients. Such changes can either be orchestrated by the regular HTTP request of one user (for e.g. new status of a database model during that request handling), a client-only action, or in response to a 3rd-party subject. Since web-socket us mainly for transmitting data back and forth clients, if a client originated action is expected to mutate the database in-between that flow, a regular AJAX request should be sent to the server.

The `turbo-stream-source` tag requires a `src` attribute for defining the target URI source. Fortunately, the Roadrunner load-balancer that powers Suphle [application servers](/docs/v2/application-server) is equipped with a plugin for spinning up web-socket servers. To connect it, you have to start by including its entries in your server config yaml file. The reference config includes the following settings:

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
    # This option is required.
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
class BasicTemplateTest extends ModuleLevelTest
{
    public function test_failed_validation_always_reverts_errors_to_previous_on_browser()
    {
        $this->get("/get-without"); // given

        $response = $this->post("/post-with-html", $this->csrfField); // when

        // then
        $response->assertUnprocessable()
        ->assertSee("Edit form");
    }
}
```

As already explained in the Appendix chapter regarding what [aspects of the software constitute meaningful tests](/docs/v2/appendix/What-to-test), you can only go so far with verifying DOM elements. However, if you insist, you may be better served by installing [a package](https://github.com/nunomaduro/laravel-mojito) that provides greater verification functionality for Blade templates.

```bash
composer require --dev nunomaduro/laravel-mojito
```

The library contains methods closer to fine-grained CSS selectors, for example `empty`, `hasAttribute`, `hasMeta`, etc.