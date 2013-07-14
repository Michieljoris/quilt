It looks like the cors settings were not applied to the server yet.

You can choose not too modify CouchDB but you will have to run a cors
proxy for the roster app to access the database. 

<button class="btn btn-small btn-primary" ng-click="connect()">Set
server cors settings</button>

The following settings will be applied:

	credentials:true
	enable_cors:true
	origins:*
	headers:accept, origin, authorization, content-type,
	X-CouchDB-WWW-Authenticate, X-Couch-Full-Commit
	methods:DELETE, GET, HEAD, POST, OPTIONS, PUT
