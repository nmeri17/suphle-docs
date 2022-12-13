## View Rendering

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