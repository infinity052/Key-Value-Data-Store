const fs = require("fs");
const path = require("path");
const trie = require("./Trie");

class Storage{
    
    constructor(location = __dirname){

        this.location = path.join(location, "database");
        this.fileNumber = 0;
        this.indexLocation = path.join(this.location, "index.json");
        this.currentFileJson = {"lock" : false, "data" : {}};

        if(!fs.existsSync(this.location))
            fs.mkdirSync(this.location);
        
        if(!fs.existsSync(this.indexLocation))
            fs.writeFileSync(this.indexLocation, JSON.stringify({"root" : {}}), {encoding : "utf8", flag : "w"});
        

        this.trie = new trie(this.indexLocation, JSON.parse(fs.readFileSync(this.indexLocation, {encoding: "utf8", flag : "r"})));

        this.updateCurrentFile();
    }

    getFileSizeInMB(fileNumber){
        return parseFloat(fs.statSync(path.join(this.location, fileNumber + ".json")).size) / (1024*1024);
    }
    
    updateFileNumber(fileNumber){
        fs.writeFileSync(path.join(this.location, fileNumber + '.json'), `{"lock" : false, "data" : {}}`, {encoding : "utf8", flag : "w"});
        fs.writeFileSync(path.join(this.location, 'CurrentFile.dat'), "" + fileNumber, {encoding : "utf8", flag : "w"});
    }

    loadNewFile(fileNumber){
        var fileLocation = path.join(this.location, fileNumber+".json");
        return JSON.parse(fs.readFileSync(fileLocation, {encoding: "utf8", flag: "r"}));
    }

    updateCurrentFile(){

        if(!fs.existsSync(path.join(this.location, 'CurrentFile.dat'))){
            this.updateFileNumber(this.fileNumber);
            this.fileLocation = path.join(this.location, this.fileNumber + ".json");
            this.currentFileJson = this.loadNewFile(this.fileNumber);
        }
        
        else{

            const fileNumber = parseInt(fs.readFileSync(path.join(this.location, 'CurrentFile.dat'), {encoding : "utf8", flag: "r"}));

            if(this.getFileSizeInMB(fileNumber) >= 1){
                this.fileNumber = fileNumber + 1;
                this.updateFileNumber(this.fileNumber);
            } 
            else
                this.fileNumber = fileNumber;
                       

            this.fileLocation = path.join(this.location, this.fileNumber + ".json");
            this.currentFileJson = this.loadNewFile(this.fileNumber);
        }     
        
    }

    commitFile(fileNumber, fileJson){
        fs.writeFileSync(path.join(this.location, fileNumber + ".json"), JSON.stringify(fileJson), {encoding: "utf8", flag: "w"});
    }
    commitIndex(){
        fs.writeFileSync(this.indexLocation, JSON.stringify(this.trie.commit()), {encoding: "utf8", flag : "w"});
    }

    read(key){
        this.updateCurrentFile();
        this.acquireLockOnFile(this.fileNumber);
        key = "" + key;
        var file = this.trie.exists(key);
        if(!file.exists){
            this.releaseLockOnFile(this.fileNumber);
            return "Key does not exist";
        }
        if(file.expired){
            this.releaseLockOnFile(this.fileNumber);
            this.delete(key);
            return "Key has been expired";
        }
        var fileToBeRead = this.loadNewFile(file.file);
        this.releaseLockOnFile(this.fileNumber);
        return fileToBeRead["data"][key];
    }

    create(key, value, timeToLiveInMinutes = -1){
        if(key.length > 32)
        {
            throw new Error("key size greater than 32 characters");
        }
        else if(value)
        this.updateCurrentFile();
        this.acquireLockOnFile(this.fileNumber);
        key = "" + key;
        if(!this.trie.insert(key, this.fileNumber, timeToLiveInMinutes)){
            this.releaseLockOnFile(this.fileNumber);
            return false;
        }
        this.currentFileJson["data"][key] = value;
        this.commitFile(this.fileNumber, this.currentFileJson);
        this.commitIndex();
        this.releaseLockOnFile(this.fileNumber);
        return true;
    }
    delete(key){
        this.updateCurrentFile();
        this.acquireLockOnFile(this.fileNumber);
        key = "" + key;
        var file = this.trie.exists(key);
        if(!file.exists){
            this.releaseLockOnFile(this.fileNumber);
            return false;
        }
        var fileJson = this.loadNewFile(file.file);
        delete fileJson["data"][key];
        this.commitFile(file.file, fileJson);
        this.trie.delete(key);
        this.commitIndex();
        this.releaseLockOnFile(this.fileNumber);
        return true;
    }
    acquireLockOnFile(fileNumber){
        var fileJson = this.loadNewFile(fileNumber);
        while(fileJson["lock"]){
            fileJson = this.loadNewFile(fileNumber);
        }
        fileJson["lock"] = true;
        this.commitFile(fileNumber, fileJson);
    }
    releaseLockOnFile(fileNumber){
        var fileJson = this.loadNewFile(fileNumber);
        fileJson["lock"] = false;
        this.commitFile(fileNumber, fileJson);
    }
    getLocation(){
        return this.location;
    }

    exists(key){
        key = "" + key;
        return this.trie.exists(key) != -1;
    }
}

module.exports = Storage;