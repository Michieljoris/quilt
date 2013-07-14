If you can't connect this could be for the following reasons:

* You have not installed CouchDB.

  Please download CouchDB for windows from [here][couchdb for windows],
  for mac [here][couchdb for mac] and linux [here][couchdb for linux].
  Installing is a matter of just clicking Next. There is one step that
  asks you wheter you want run the database as a service. If you say
  'No' you will have to manually start CouchDB on every restart of your computer.
  After downloading and installing come back to this page.

* CouchDB is installed but is not configured properly (which it isn't
  after a fresh install).
  
  You can remedy this by doing one of the following:
  
  1. Download this little [utility][corsproxy.zip]. Unzip its content
  somewhere on you hard drive and double click the cors-proxy.bat in the unzipped
  folder.  Under Linux install node.js first, then execute "node server.js". That should
  work on a Mac as well. Then come back to this page and refresh
  or click the connect button. This proxy server assumes your CouchDB
  instance is on http;//localhost:5984<p>
  I will then try to configure CouchDb to enable access without having to
  use this little utility. This will only work with a CouchDB that is
  not locked down yet with a server admin password (as is the case
  after a fresh install). <p>
  This is the simplest solution for a fresh install.
  
  1. Download this [file][couchdb ini file]. In windows copy this to
  C:\Program Files (x86)\Apache Software
  Foundation\CouchDB\etc\couchdb\local.ini. In Linux it is somewhere
  like /usr/local/etc/couchdb/local.ini Overwrite the file that's
  there already. Restart the CouchDB service, or restart the
  computer. CouchDB should now be accessible from this site. <br>
  **_Warning: Don't do this if you or somebody else has already configured CouchDB at  all. Besides clobbering current settings, it also will remove any existing server admins and set up a new admin (with password admin)._**
  
  1. If you know what you're doing go to the database config page, most
  likely [here][local couchdb config] for a local
  install. If your CouchDB is on a network somewhere you will need to
  replace the _localhost:5984_ part of this address with the proper address and
  port. <p> 
  You will need server admin credentials for a locked down CouchDB. On
  a fresh install you don't. Look for the option **enable_cors** and
  change its value to **true**. Look for the **credentials** options and
  change its value to **true**. Then go to the bottom of the page and
  click **Add a new section**. Fill in **cors**, **origins** and *****
  for **section**, **option** and **value** respectively. Refresh this page or click the
  connect button.
  
* CouchDB is installed and configured properly but neither of the addresses entered
  at the top of the page are correct. 
  
  * Carefully check the addresses you've
  entered. 
  
  * Is the port correct? For instance if you're CouchDB is on a https address the port is
  probably 6984. 
  
  * The second address is the default address for the
  little CorsProxy server that enables access. If you have a different
  cors proxy server that enables access to your CouchDB fill that in
  there. 
  
  * Can you open the default address for the CouchDB instance in
  a browser window? For a local CouchDB this is for instance
  [http://localhost:5984](). You should see a empty page with
  something like:

      {"couchdb":"Welcome","uuid":"4418cad0d9bd42aabccad6cd71d1b5eb","version":"1.3.0","vendor":{"version":"1.3.0","name":"The
  Apache Software Foundation"}}
 
The above tips assume you want the simplest setup possible. If you
don't want to enable cors for the CouchDB server you can use the
cors proxy server for all future access to the database. You will
have to run it every time before you use the roster app. You could
put it in the startup folder of windows. Your access will be through
the address http://localhost:1234. 

If your setup is more complicated contact me on <mailto:michieljoris@gmail.com>
  
[couchdb for windows]: http://www.apache.org/dyn/closer.cgi?path=/couchdb/binary/win/1.3.1/setup-couchdb-1.3.1_R15B03-1.exe
[couchdb for mac]: http://www.apache.org/dyn/closer.cgi?path=/couchdb/binary/mac/1.3.1/Apache-CouchDB-1.3.1.zip
[couchdb for linux]: http://www.apache.org/dyn/closer.cgi?path=/couchdb/source/1.3.1/apache-couchdb-1.3.1.tar.gz
[corsproxy.zip]: cors-proxy.zip
[couchdb ini file]: local.ini
[local couchdb config]:http://localhost:5984/_utils/config.html




