## Introduction

This chapter relates to conventions and configurations for objects that enable coordinator result to be parsed against a series of files, into HTML content for a browser request or HTML mail

Suphle has a few goals it sets out to achieve in its presentation arm:
- This layer should be worked on by a designer or team member without back end expertise
- it should be as fast and responsive as csr applications
- retain age-old advantages of ssr such as seo, spectacular reduction in complexity of maintaining different teams and codebases

If this is where we talk about the renderers, describe how old and new data are being merged for Reload types. Also point out it relies on default Markup type so if that is being replaced, this guy's `render` method should follow suit

arguments for the markup renderer

transphporm config ==> note that `inferFromViewName` can be overriden for a particular renderer by passing in the VM name (see trans adapter line 27)

## view composition

This refers to the practise of pulling autonomous visual snippets responsible for their data, links, behaviour, and perhaps, styling, from diverse sources by a consumer, thereby decoupling them from the larger context they are intended to constitute. That is, as opposed to collocating all visual segments of a page representing different concepts and extracting relevant data from their respective domains
Where visual structure of the data is determined by module x instead of importing both data source and view templates

**
Turbo lets us:

1. Build reactive web pages without dirtying our hands with a ton of JavaScript boilerplate.
1. Plumb data fetched after load in-between round trips to the back-end.
1. Re-use these clients by compiling them down to applications natively executable on mobile devices.

The page's content is rendered on the server-side. Initial request is processed by the Transphporm templates. Subsequent requests consult the appropriate handlers, which in turn leads to associated Transphporm templates being processed on the server and response plugged into the Turbo client.

=======
The current responsibility of the front end comprises of binding it to the back end and client side animations or effects that make the most of limited viewport. While we avoid the data binding problem when entire app is sra, we tend to compromise on the feel/fidelity that arguably was the original selling point of fe frameworks
With the rise in html over the wire libraries such as htmx, turbo hotwire, and unpoly, we can eat our cake and have it, while cutting down on development complexity, delivery eta, team size, duplication of logic across both sides of the divide, etc. The choice of which of the libraries to go with is up to you. However, because hotwire is the most popular on the list, suphle comes with a component for facilitating work with it

For the really simple stuff –link hijacking –turbo drive takes care of all inbound links on the page it's connected to. A more complicated requirement is receiving ui feedback for actions triggered on the presentation layer, for which Turbo frames are used

## quick hotwire rundown

Finally, turbo streams are used to update multiple sections of the page simultaneously. All this are done by wrapping your partials/ssr composed view in turbo tags. This is not always convenient to do by hand, and will thus require help from suphle

### wrapping turbo streams

### hotwire form submissions

Subsection failed validation response

validation is one of the most important aspects of using hotwire solutions since they push such concerns to the back-end, sharing one single-source of truth

Partials/frames should only be returned for actions. Links should render 
full page markup so your title bar can reflect the change in navigation as 
well as seo content update

**
Because juggling too many new concepts can make hitting the ground running daunting, suphle beginners are encouraged to initialize their presentation layers with just transphporm. After getting a functional server rendered layer, they can incrementally enhance sections of this layer as context demands

Let's you connect directly to the templates without an additional wrapper. Requires links to specific handlers to avoid conditionals per coordinator.

Model id readers are necessary since incoming component needs a way to reference the dom element it seeks to replace

Turbo frame is a drop-in replacement for all the times you've had to have a front end sdk fetching data from an api into a store and then component properties and methods for binding them to the dom. For every div or container you previously pegged such data, just wrap it in a frame tag–pagination containers, product lists, etc. Depending on how much time you have or load you want to take away from your back end, it can either return only the relevant frame or the regular page but including the updated frame to replace with. The library will extract tags with ids in the response matching that which originated the request. For this reason, there are no dedicated suphle renderers for frames

## validation replacement

	- when using BrowserLoginMediator, replace failed method with a redirector using desired partials. or put a default "failed-login". replacement is done in config
	- replace CoodinatorManager with our default or a custom convention for loading the form partial.- 
		- https://turbo.hotwired.dev/handbook/drive#form-submissions
	- flows
		- combine with flows. static urls preload https://turbo.hotwired.dev/handbook/drive#preload-links-into-the-cache. dynamic use flows

connecting the broadcaster