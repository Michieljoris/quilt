This website and the roster app can't access the
CouchDB server directly when they are served from different
origins. But to configure CouchDB for our needs we need access to
it. To enable this access you have to install either a 'cors proxy' or
configure CouchDB manually. 

If you are accessing CouchDB via a proxy <span
ng-show="state.maybeCors">(it seems you are)</span> you need to
'enable cors' for the CouchDB server. See below for another option.

<p ng-show="state.corsConfigured">
It looks like your CouchDB is configured for cors access 
(<a href="#" ng-click="checkCors($event)">check again</a>). If
you're happy with this (I would) <a href="#"
ng-click="checkCors($event)">go on</a> to setting up your
database. If not read on.
</p>

<p ng-show="!state.configAccessible && !state.corsConfigured">
 <b>Please click the button and log in with server admin
 credentials so I can check whether cors settings have been configured
 correctly.</b>

<br>
<button class="btn btn-small btn-primary" ng-click="openLogin()">Log in</button>
</p>

<div ng-show="state.configAccessible && !state.corsConfigured">
To enable cors and enable the roster app to access the database
directly a certain number of settings need to be applied.
<p><p>	

<button class="btn btn-small btn-primary" ng-click="enableCors($event)">
Apply cors settings to CouchDB (recommended)</button>
<p>

<a  ng-click="isCorsSettingsCollapsed =
!isCorsSettingsCollapsed">Click to see the settings that will be applied: </a>

<div collapse= "!isCorsSettingsCollapsed">
<pre>{{defaults.corsSettings | json}}</pre>
</div>

After applying cors settings to your CouchDB instance you can use the
roster app and/or this app to access the databases, even when they're
not served from your local CouchDB.

</div>

--------------------------------------------
Instead of enabling cors on the CouchDb instance you can
serve the roster app and this app directly from
CouchDB, then they both come from the same domain, and the problem is also
solved. 
<span ng-show="state.servedFromCouchDb">
It looks like this app is already server from CouchDB.	
</span>

<span ng-hide="state.configAccessible">
<b>Please click the button right top and log in with server admin
credentials so I can replicate this and the roster app to your CouchDB.</b>
</span>

<span ng-show="state.configAccessible">
  To make this happen please click the button:<p></p>
<button class="btn btn-small btn-primary" ng-click="enableCors($event)">
Replicate this app and the roster app to your CouchDB</button>
</span>
</span>

  Go to <a href="{{state.connected}}/quilt">{{state.connected}}/quilt</a>
for this app, and <a target="_blank"
href="{{state.connected}}/roster">{{state.connected}}/roster</a> for
the roster.





	
