/*global  require:false exports:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

var nodemailer = require("nodemailer");
var http = require('http');

var contactNotificationEmail = {
    // from: "Firstdoor Server", // sender address
    to: "michieljoris@gmail.com", // list of receivers
    
    // to: "jujusilkie@gmail.com", // list of receivers
    cc: "michieljoris@justemail.net" // list of receivers
};

// create reusable transport method (opens pool of SMTP connections)

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "michieljoris@gmail.com",
        pass: process.env.MICHIELJORIS_GMAIL_PWD
        
    }
});


// // send mail with defined transport object
// function sendMail(mailOptions) {
//     smtpTransport.sendMail(mailOptions, function(error, response){
//         if(error){
//             console.log(error);
//         }else{
//             console.log("Message sent: " + response.message);
//         }

//         // if you don't want to use this transport object anymore, uncomment following line
//         //smtpTransport.close(); // shut down the connection pool, no more messages
//     });
    
// }



var sendThankyou = function (data, success, error) {
    console.log("Sending thankyou!!!!");
    var text = "Dear " + data.username + ",<p>" +
        "Thank you for contacting First Door.<p>" +
        "We will be in contact with you soon.<p>" +
        "Regards,<p>" +
        "The First Door team";

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: "admin@firstdoor.com.au", // sender address
        to: data.email, // list of receivers
        // to: "michieljoris@gmail.com", // list of receivers
        subject: "Thank you for contacting First Door", // Subject line
        // text: data.message // plaintext body
        html: text // html body
    };
    
    smtpTransport.sendMail(mailOptions, function(err, response){
        if(err){
            console.log(err);
            error(err);
        }else{
            console.log("Message sent: " + response.message);
            success(response.message);
        }

        // if you don't want to use this transport object anymore, uncomment following line
        //smtpTransport.close(); // shut down the connection pool, no more messages
    });
    // sendMail(mailOptions);
};

var sendEmail = function (data, success, error) {
    console.log("Sending email!!!!");
    var text = data.username + " with email address " + "<a href='mailto:" + data.email + "'>" + data.email + "</a>" +
        " sent the following message: <p>" + data.textmessage;
    // setup e-mail data with unicode symbols
    var mailOptions = contactNotificationEmail;
    mailOptions.subject = data.username + " has used the First Door contact us form!"; // Subject line
    // text: data.message // plaintext body
    mailOptions.html = text; // html body
    
    smtpTransport.sendMail(mailOptions, function(err, response){
        if(err){
            console.log(err);
            error(err);
        }else{
            console.log("Message sent: " + response.message);
            success(response.message);
        }

        // if you don't want to use this transport object anymore, uncomment following line
        //smtpTransport.close(); // shut down the connection pool, no more messages
    });
    // sendMail(mailOptions);
};

function recaptcha_verify(parameters, success, error) {
    //comment out the next two lines to enable captcha checking
    //see firstdoor on how to implement client side (in www/js/controllers.js)
    success();
    return;
    // console.log(parameters);
    console.log("Verifying captcha");

    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': parameters.length
    };
    var options = {  
        host: 'www.google.com',   
        port: 80,   
        path: '/recaptcha/api/verify',  
        data: parameters,
        method: 'POST',  
        headers: headers
    };   
   // console.log("Defining req");
    var req = http.request(options, function(res) {       
        // console.log("Got response: " + res.statusCode);   
        // console.log('HEADERS: ' + JSON.stringify(res.headers));  
        res.setEncoding('utf-8');

        var response = '';
        res.on('data', function(chunk) {  
            response += chunk;
        });   
        res.on('end', function() {
            var arr = response.split('\n');
            response = {
                success: arr[0],
                error: arr[1]
            };
            // console.log('Verifying captcha result:', response);
            if (response.success === 'true') success();
            else error(response.error);
            
        });
        req.on('error', function(e) {
            console.log("Error in captcha verify ", e);
            error('Couldn\'t verify captcha!!!' + e.toString());
        });
    });   
    // console.log("Writing request to captcha");
    req.write(parameters);
    req.end();
}

exports.handlePost = function(req, res) {
    console.log('Firstdoor send mail is handling post!!');
    console.log(req.headers['x-forwarded-for']);
    var data = '';
    req.on('data', function(chunk) {
        data+=chunk;
    });
    
    res.writeHead(200, "OK", {'Content-Type': 'text/html'});
    
    req.on('error', function(e) {
        res.write(JSON.stringify({ success:false, error:e }));
        res.end();
    });
    
    req.on('end', function() {
        try {
            console.log("Received body data:");
            data = JSON.parse(data);
            var parameters = 'privatekey=6LfL6OASAAAAAHklMnnQdS4AmZvXuOp1ihgPY7V9&remoteip=' + req.headers['x-forwarded-for'] +
                '&challenge=' + data.recaptcha_challenge + '&response=' + data.recaptcha_response;

            recaptcha_verify(parameters,
                             function() {
                                 sendEmail(data,
                                                    function() {
                                                        res.write(JSON.stringify({ success:true }));
                                                        res.end();
                                                    },
                                                    function(e) {
                                                        res.write(JSON.stringify({ success:false, error:e }));
                                                        res.end();
                                                        
                                                    });
                                 sendThankyou(data,
                                                    function() {
                                                        // res.write(JSON.stringify({ success:true }));
                                                        // res.end();
                                                    },
                                                    function(e) {
                                                        // res.write(JSON.stringify({ success:false, error:e }));
                                                        // res.end();
                                                        
                                                    });
                             },
                             function(e) { console.log("failed to verify captcha:" + e);
                                           res.write(JSON.stringify({ success:false, error: e}));
                                           res.end();

                                         }
                            );
        } catch(e) {
            console.log("Failure!!!", e);
            res.write(JSON.stringify({ success:false, error: e}));
            res.end();
        }
    });
            
}; 
