<ul class="nav nav-tabs">
  <li><a href="#home" data-toggle="tab">Setup COUch</a></li>
  <li><a href="#profile" data-toggle="tab">Profile</a></li>
  <li><a href="#messages" data-toggle="tab">Messages</a></li>
  <li><a href="#settings" data-toggle="tab">Settings</a></li>
</ul>

Setup CouchDB


_____

<div ng-hide="state.configAccessible">
<b><em>Please click the button to login as a server admin so I can setup your CouchDB.</em></b>
<button class="btn btn-small btn-primary" ng-click="openLogin()">Log
in your CouchDB</button>
</div>

<span ng-show="state.partyMode">
Your CouchDB is in party mode as it's called. Which means there is no
server admin configured. This makes your database quite insecure. It
is not strictly necessary, but highly recommended to create a server
admin. Please click the button to do so.
<button class="btn btn-small btn-primary" ng-click="createServerAdmin()">Log
in your CouchDB</button>
</span>

<b><i>Please supply the address and credentials for the remote CouchDB you want to
synchronize with.<p></i></b>

Remote CouchDB: <a href="#" id="remoteUrl" data-type="text"></a> <br>
User name: <a href="#" id="remoteUserName" data-type="text" ></a> <br> 
Password: <a href="#" id="remotePassword" data-type="password" ></a> <br>

<b><i>Please edit the list of locations you want to synchronize with
your CouchDB.<p></i></b>
<a href="#" id="locationsToSync" data-type="checklist"
data-original-title="Select locations"></a> <br>

<p><p>

<button class="btn btn-small btn-primary"
ng-click="setupSimple()">Setup your CouchDB!!</button>
