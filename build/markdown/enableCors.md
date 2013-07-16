<div ng-show="state.maybeCors">
It looks like we're accessing CouchDB through my cors proxy. 
<p>

You can choose not too modify CouchDB but you will have to keep running this cors
proxy so the roster app can access the database. 
</div>

To enable cors and enable the roster app to access the database
directly a certain number of settings need to be applied.
	
<p ng-show="!isAdminLoggedIn()">
 Please click the button right top and log in with server admin
 credentials so I can check whether cors settings have been configured correctly.
</p>

This section and button will be accessible as long as there is a discrepancy
between recommended and actual settings.

<button class="btn btn-small btn-primary" ng-click="enableCors()">
Apply cors settings to CouchDB</button>

The following settings will be applied:

<pre>{{defaults.corsSettings | json}}</pre>

	
