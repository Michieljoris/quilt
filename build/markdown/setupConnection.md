<p ng-hide="state.disconnected"> 
I have tried to connect to CouchDB with the following two addresses:
</p>

<p ng-show="state.disconnected"> Please enter the urls of the CouchDB you want to try to connect to:</p>

- <a href="#" id="couchDBurl" data-type="text"></a> (CouchDB)

- <a href="#" id="corsProxy" data-type="text" ></a> (Cors proxy)

<div ng-hide="state.disconnected">
Neither of them gave back a valid response.

Please correct them (by clicking on them) and then click the connect
button or refresh the page.
</div>

<button class="btn btn-small btn-primary" ng-click="connect()">Connect</button>

