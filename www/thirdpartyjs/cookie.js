/*global unescape:false escape:false VOW:false*/
/*jshint strict:false unused:true smarttabs:true eqeqeq:true immed: true undef:true*/
/*jshint maxparams:7 maxcomplexity:7 maxlen:150 devel:true newcap:false*/ 

/**
   
 /*\
 |*|
 |*|  :: cookies.js ::
 |*|
 |*|  A complete cookies reader/writer framework with full unicode support.
 |*|
 |*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
 |*|
 |*|  Syntaxes:
 |*|
 // |*|  * Cookie.set(name, value[, end[, path[, domain[, secure]]]])
 // |*|  * Cookie.get(name)
 // |*|  * Cookie.remove(name[, path])
 // |*|  * Cookie.has(name)
 // |*|  * Cookie.keys()
 |*|
 \*/
 
window.cookie = {
    useVows: false,
    get: function (sKey) {
        if (!sKey || !this.has(sKey)) {
            if (this.useVows) {
                return VOW.broken('Cookie does not exist: ' + sKey);
            }
            else return null; }
        var result = unescape(document.cookie.replace(
            new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
                       "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
        if (this.useVows)  {
            if (result) return VOW.kept(result); 
	    return VOW.broken('Can not find cookie:' + name);
        }
        else return result;
    },
    set: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
            if (this.useVows) 
                return VOW.broken('Illegal cookie' + sKey + sValue);
            else return null;
        }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
              case Number:
                sExpires = vEnd === Infinity ? "; expires=Tue, 19 Jan 2038 03:14:07 GMT" : "; max-age=" + vEnd;
                break;
              case String:
                sExpires = "; expires=" + vEnd;
                break;
              case Date:
                sExpires = "; expires=" + vEnd.toGMTString();
                break;
            }
        }
        var newCookie = escape(sKey) + "=" + escape(sValue) + sExpires +
            (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") +
            (bSecure ? "; secure" : "");
        // console.log(newCookie);
        document.cookie = newCookie;
        if (this.useVows) {
            return this.get(sKey);
        }
        else return sValue;
    },
    remove: function (sKey, sPath) {
        if (!sKey || !this.has(sKey)) {
            if (this.useVows) {
                VOW.kept("Cookie is already non-existant");
            }
            return null; }
        document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sPath ? "; path=" + sPath : "");
        if (this.useVows) {
            if (this.has(sKey)) return VOW.broken("Can't remove cookie: " + sKey);
            return VOW.kept();
        }
        else return null;
    },
    
    has: function (sKey) {
        return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    },
    keys: /* optional method: you can safely remove it! */ function () {
        var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
        for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = unescape(aKeys[nIdx]); }
        return aKeys;
    }
};
