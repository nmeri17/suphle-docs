## View Rendering

Suphle has a few goals it sets out to achieve in its presentation arm:
- This layer should be worked on by a designer or team member without back end expertise
- it should be as fast and responsive as csr applications
- retain age-old advantages of ssr such as seo, spectacular reduction in complexity of maintaining different teams and codebases

If this is where we talk about the renderers, describe how old and new data are being merged for Reload types. Also point out it relies on default Markup type so if that is being replaced, this guy's `render` method should follow suit

arguments for the markup renderer

transphporm config ==> note that `inferFromViewName` can be overriden for a particular renderer by passing in the VM name (see trans adapter line 27)