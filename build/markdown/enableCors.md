This website and the roster app can't access the
CouchDB server directly because they are served from different
origins. But to configure CouchDB for our needs we needed access to
it. That's why you either installed a 'cors proxy' or
configured CouchDB manually to enable this access. 

However you need to choose a solution for long term access. My recommendation
is to 'enable cors' for the CouchDB server. See below for other
options.

<p ng-show="state.corsConfigured">
It looks like your CouchDB is configured just the way I need it to
be (<a href="#" ng-click="checkCors($event)">check again</a>). If you're happy with this (I would) go on to setting up your
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
Automatically apply cors settings to CouchDB</button>
<p>
For info on how to do this manually please <a href="#"
ng-click="reset($event)">disconnect</a> and look at the help on how to
enable access to CouchDB.
<p>

<a  ng-click="isCorsSettingsCollapsed =
!isCorsSettingsCollapsed">Click to see the settings that will be applied: </a>

<div collapse= "!isCorsSettingsCollapsed">
<pre>{{defaults.corsSettings | json}}</pre>
</div>

</div>

--------------------------------------------

###Other options:

* You can choose not too modify CouchDB at all. But you will have to have a cors
proxy in the background at all times so the roster app can access the
database. <span ng-show="state.maybeCors">
It looks like we're accessing CouchDB through cors proxy at the
moment. If so, you're done. 
</span> 

  For info on how install to install this proxy <a href="#" ng-click="reset($event)">disconnect</a> and look at the help on how to enable access to CouchDB.

1. The third option is to serve the roster app and this app from
CouchDB, then they both come from the same domain, and the problem is
solved. 
<span ng-show="state.servedFromCouchDb">
It looks like this app is already server from CouchDB.	
</span>
<span ng-hide="state.servedFromCouchDb">
<span ng-hide="state.configAccessible">
<b>Please click the button right top and log in with server admin
credentials so I can replicate this and the roster app to your CouchDB.</b>
</span>
<span ng-show="state.configAccessible">
  To make this happen please click the button:<br><br>
<button class="btn btn-small btn-primary" ng-click="enableCors($event)">
Replicate this app and the roster app to the local database</button>
</span>
</span>

  Go to <a href="{{state.connected}}/quilt">{{state.connected}}/quilt</a>
for this app, and <a target="_blank" href="{{state.connected}}/roster">{{state.connected}}/roster</a> for the roster.


	
