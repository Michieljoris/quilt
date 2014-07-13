/*global process:false require:false exports:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

exports.handlePost = function(req, res) {
    console.log('Signout is handling post!!');
    console.log(req.headers['x-forwarded-for']);
    
    res.writeHead(200, "OK", {'Content-Type': 'text/html'});
    
    var data = '';
    req.on('data', function(chunk) {
        data+=chunk;
    });
    
    req.on('end', function() {
        req.session.expire();
        res.write(JSON.stringify({ success:true }));
        // data = JSON.parse(data);
        // console.log(data.assertion);
        res.end();
    });
    
    req.on('error', function(e) {
        req.session.expire();
        res.write(JSON.stringify({ success:true, error:e }));
        res.end();
    });
    
};
