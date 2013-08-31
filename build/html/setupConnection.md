<p ng-show="state.connecting">
Trying to connect to the following urls:
</p>

<p ng-hide="state.disconnected || state.connecting">
I have tried to connect to CouchDB with the following two addresses:
</p>

<p ng-show="state.disconnected && !state.connecting"> Please enter the urls of the CouchDB you want to try to connect to:</p>

- <a href="#" id="couchDBurl" data-type="text"></a> (CouchDB)
<br>
- <a href="#" id="corsProxy" data-type="text" ></a> (Cors proxy)

<div ng-hide="state.disconnected || state.connecting">
Neither of them gave back a valid response.

Please correct them (by clicking on them) and then click the connect
button or refresh the page.
<p>
<button class="btn btn-small btn-primary"
ng-click="connect()">Connect</button>
</p>
</div>


<p ng-show="state.connecting">
<button class="btn btn-small btn-primary"
ng-click="connect()">Try to connect again</button> </p>
