const fs = require("fs");

class Trie{
    constructor(location, trie){
        this.location = location;
        this.trie = trie;
    }
  
    exists(key){
        var currObj = this.trie["root"];

        for(let index = 0; index < key.length; index++)
            if(key.charCodeAt(index) in currObj)
                currObj = currObj[key.charCodeAt(index)];
            else
                return {exists: false};

        if(!currObj.end)
            return {exists: false};

        var expired = false;

        if("time" in currObj){
            var diff = parseFloat(Math.abs(new Date() - new Date(JSON.parse(currObj.time))))/(1000*60);
            expired = diff >= currObj.expires;
        }

        return {exists: true, file: currObj.file, expired: expired};
    }

    commit(){
        return this.trie;
    }

    insert(key, fileNumber, timeToLive){
        var currObj = this.trie["root"];
        for(let index = 0; index < key.length; index++){
            if(!(key.charCodeAt(index) in currObj))
                currObj[key.charCodeAt(index)] = {};
            
            currObj = currObj[key.charCodeAt(index)];
        }

        if(currObj.end == true)
            return false;
        
        currObj.end = true;
        currObj.file = fileNumber;
        if(timeToLive != -1){
            currObj.time = JSON.stringify(new Date());
            currObj.expires = timeToLive;
        }
        return true;
    }
    delete(key){
        var currObj = this.trie["root"];

        for(let index = 0; index < key.length; index++)
            if(key.charCodeAt(index) in currObj)
                currObj = currObj[key.charCodeAt(index)];
            else
                return;

        currObj.end = false;
        if("expires" in currObj)
            delete currObj["expires"];
        if("time" in currObj)
            delete currObj["time"];
        this.commit();
    }

}

module.exports = Trie;