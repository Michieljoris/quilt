quilt
=====

Opiniated CouchDB manager, similar to Futon.

I thought Futon was a bit cumbersome, and my setup for CouchDB for another app was a bit involved so I wrote a easier manager.

It tries to step you through installing and setting up a CouchDb instance, configuring cors if necessary.

Once the app has access you can edit user, databases, design documents and replications.

The ace editor is used to edit design functions, you can select multiple databases and copy functions between them and more.

All replication params can be edited and set. 

You can save replications and design functions in local storage or in a CouchDB database, which you can sync or pull from another CouchDB instance

There is an examine tab that lets you make queries and view conflicts, change feeds and the CouchDB log. 

The test tab under Examine lets you set up simple read and write tests to test security set by the security object of databases and any validate_doc_update functions.

Clone the repo, then run ./serve in the root dir, and visit the app at the port displayed. 

Or run ./develop and edit the source. On save the site gets rebuilt. Refresh the browser to see the result.

