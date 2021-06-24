##AUTH
*Login request
        - matches config login route? pick config login service and attempt 
login
        - set this service as the renderer controllers
        - depending on a)'s result, one of b)'s renderers are executed
        - executioner expects to receive an AuthStorage that determines 
whether it's session or jwt request is getting back


#Review this
Request for auth route comes in:
        - depending on the authentication type (jwt/session/custom ), user 
id is retrieved
        - this id is forwarded to a reliable person accessible to 
controllers/request/container who are interested in retrieving auth user
        - in the background, he receives a concrete orm from any container 
available and can hydrate a user out of the id he was given
        - he is also overwritable in case dev wants a custom way of user 
hydration
        - he's the one responseManager interfaces with and decides a user 
is unauthenticated when his id is missing