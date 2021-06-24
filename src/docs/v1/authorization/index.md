##AUTHORIZATION
Authorization is divided into two categories: route based protection and a 
entity/model based approach. Of the two, the latter is both more flexible and 
more powerful. With it in place, you will have little use for its 
counterpart.

Route authorization occurs at a high level covering routes below it. But 
its utility shines better for paths that don't interact with the underlying 
database. Routes computing data or communicating with external clients are 
encouraged to be protected at the route layer when they grant access to 
privileged users
...
Authorization is often wrongly relegated to being used for restricting 
access to administrative dashboards. However, their usefulness transcends 
that. 

Every resource created by authenticated users is usually stored with a 
reference to its creator —posts, comments, products, and what have you. In 
most applications, we want to restrict CRUD access of such resources to 
their creator. The risk of merely receiving resource identifiers for the 
currently logged in user implies they can violate the privacy of other 
users by simply transferring identifiers to their resources over the wire

By securing them at the model layer, one can be guaranteed that those 
resources are constantly in the safe hands of their creator, site 
administrator, collaborator, and the application's developer. Without such 
contraceptive in place, new additions to a team, implementing new features, 
will either need to be aware of existing authorization rules for those 
resources, roll out a new one, or worse, expose them to the whole world!

It equally provides the added advantage of centralizing module rules to 
where one can quickly glance at available permissions for each resource