# Contributing

It is emotionally uplifting that you feel compelled to take time out of your schedule to invest in what makes Suphle tick. However, the breathtaking improvements you are bringing on board will be better received if it meets a few non-negotiable criteria. This is not to say your modalities are inaccurate, but it's an attempt to ensure a consistent, homogenic fundamental code style.

1. First and foremost, there is no need for includes or requires anywhere.

1. Traits should be avoided in favour of object composition/aggregation.

1. "Magical" behaviour should be kept at arm's length. If you have to decide between creating a fairly attractive API that performs arcane actions obscuring intuitive use of the language, sacrifice the beautiful API. It doesn't pay off in the long run when new persons are battling to grasp how things work.
Alternatively, propose such API in an issue if you're absolutely certain about its essence.

1. Functions/closures should be avoided at all costs. They either violate the include rule or live in global scopes that bring ridicule to this great language.

1. Even when attributes are implemented as a core language feature, avoid the temptation to support route definition in files. While it provides an opportunity for co-locating endpoints and their corresponding handlers, it quickly becomes undesirable when the need for tracing an endpoint arises 

1. Prefer creating DTOs over using associative arrays.

1. Method signatures cannot receive mysterious "mixed" type where the argument has to be determined prior to value derivation.

1. Unless where arguments can only be derived at definition point, fully qualified class names should be supplied instead of concrete instances.

That's it. If you are in agreement, please examine features on [the roadmap](/docs/v1/roadmap), or create a new issue labelled "feature" to discuss something new not there yet.

Thanks again.

define cs rules, link to discussions and help-wanted issues