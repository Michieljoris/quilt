<div ng-hide="state.configAccessible">
<b><em>Please click the button to login as a server admin so I can setup your CouchDB.</em></b><p>
<button class="btn btn-small btn-primary" ng-click="openLogin()">Log
in your CouchDB</button>
</div>

<div ng-show="state.configAccessible">
<div ng-show="getAdminNames().length==0">Your CouchDB is in party
mode! <p></p>Everyone is admin. Please add an server admin user to fix this.. </div>
<ul >
<li style="list-style-type:none;" ng-repeat="admin in getAdminNames()">
<a style="color:orange;padding-right:5px;" href="" ng-click="removeAdminUser(admin)">x</a> <a href="" ng-click="setPwd(admin)">{{admin}}</a> 
</li>
</ul>

<button class="btn btn-small btn-primary"
ng-click="addAdminUserDialog()">Create new
server admin</button>

<!-- <pre>{{getAdminNames() | json}}</pre> -->

<!-- <pre>{{state.configAccessible | json}}</pre> -->

</div>


<div id="addAdminDialog" modal="newAdminShouldBeOpen" close="closeAdmin()" options="logopts">
  <div class="modal-header">
	<h3 ng-hide="justPwd">Create server admin</h3>
	<h3 ng-show="justPwd">{{userName}}</h3>
  </div>
  <div class="modal-body">
	<form>
	  <fieldset>
		<input ng-hide="justPwd" type="text" placeholder="new server admin name" ng-model="userName"><br>
		<input type="password" placeholder="password" ng-model="password">
	  </fieldset>
	</form>

	  </div>
	  <div class="modal-footer">
		<button class="btn btn-warning cancel pull-left" ng-click="closeAdmin()">Cancel</button>
		<button ng-hide="justPwd" class="btn btn-primary" ng-click="addAdminUser()">Ok</button>
		<button ng-show="justPwd" class="btn btn-primary" ng-click="addAdminUser()">Set</button>
	  </div>
</div>
