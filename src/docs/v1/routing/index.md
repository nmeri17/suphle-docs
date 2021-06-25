## Routing
Route definitions are controller adapters; which means that 
for all the power controllers are known to wield, they are answerable to 
what 
is being dictated from route definitions. As will soon be seen with route 
collections, one can plug in various coexisting controller implementations 
as the need may be
Route methods PATH_id_EDIT_id2. Double underscore with all uppercase = 1 
underscore. One underscore = hyphen. Underscore before all uppercase = 
slash. Underscore before all lower case = placeholder
PATH_foo_EDIT_bar0 // the 0 trailing bar makes it an 
optional parameter?

Request is null inside route permissions but is available in the service 
permissions method

#
While it's neater to initialize renderers in a collection's constructor, 
since only one would get used, considering methods aren't evaluated except 
their pattern matches, instantiating new ones pays off in the long run

#
Api endpoints are backwards compatible. Backwards, then compatible. We need 
the given version of a path. If it isn't specified on this version, we look 
for it on the previous version, recursively
Lazy loading the route classes on demand

In the route register
BrowserRoutes = // calling api mirror on those classes populates below 
object, while preventing routes we only want to have gui routes from 
getting in there

ApiRoutes = [V1 => this->browserRoutes(), v2 => classB ] //

1) request comes in for v1, we skip v2 
2)  v2, we slice the array from v2, and load backwards till a match is 
found 

#
The routes are loaded into arrays keyed by the last slash ie. Routes under 
/store go into an array. If the incoming url doesn't match that base path, 
we avoid delving deeper to parse

You don't have to Extend api route collections. we're not reading its 
parents automatically from a numerically indexed array of versions cuz it 
won't be immediately understood by a human reader

## CANARIES AND FEATURE TOGGLING
*jump to content/ interlude*

An often encountered scenario is that of short-lived features implemented 
within our app, or perhaps, we're opening up a feature to a group of users. 
These are actually two distinct occurrences. The latter is an attempt to 
decipher which group of features eventually become integrated into the main 
application. The standard term for this is canary releases. On the other 
hand, the former involves temporary updates we want all users to utilize
The situation with canary releases is often solved at the deployment level. 
The devops engineers are looked upon to route a small subsection of random 
users to parallel instances of our project. But what happens to teams/ solo 
developers without access to complimentary devops members?

There are two common ways of globally managing feature states. The first 
one relies on a devops guy to deploy the feature branch (and revert to the 
main branch). The second approach follows reading the availability of such 
feature from a feature toggle file, a .env, database, or what have you

While these do work, we tend to leave behind dead code at the toggle points 
when we're no longer interested in those features. At times like this, our 
logic layer becomes cluttered with conditionals that will never run.

#
Canary releases should protect URLs under it from direct access, except 
users are authorized to be there. Thus, it makes sense for calls for user 
fetching is restricted to those matching criteria in the canary. This 
feature can equally be used when implementing gates