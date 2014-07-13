function encrypt(pwd, obj) {
    "use strict"; 
    var string = JSON.stringify(obj);
    var result=[];
    for(var i=0;i<string.length;++i)
    {
        var c = pwd.charCodeAt(i % pwd.length)^ string.charCodeAt(i);
        result.push(c);
    }
    return result;
}

function decrypt(pwd, array)
{
    "use strict";
    var result="";
    for(var i=0;i<array.length;++i)
    {
        var c = pwd.charCodeAt(i % pwd.length)^ array[i];
        result+=String.fromCharCode(c);
    }
    return JSON.parse(result);
}
