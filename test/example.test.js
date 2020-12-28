const { assert } = require("chai");
const expect = require("chai");
var storage = require("../Storage");
storage = new storage();

var keys = [];
for(let i = 0; i < 30; i++)
    keys.push(i);

var values = [];

for(let i = 0; i < 30; i++){
    values.push({"test1" : {"test2" : {"test3" : i}}});
}

var toBeDeleted = [0,1,2,3,4,5,6,7,8];

describe('Testing keys creation', ()=>{
    for(let i = 0; i < 30; i++)
        it('Should return true', ()=>{
            assert.equal(storage.create(keys[i],values[i]), true);
        })
});

describe('Testing keys reading', ()=>{
    for(let i = 0; i < 30; i++)
        it('Should return key\'s value', ()=>{
            assert.equal(JSON.stringify(storage.read(keys[i])), JSON.stringify({"test1" : {"test2" : {"test3" : i}}}));
        })
});

describe('Testing keys deletion', ()=>{
    for(let i = 0; i < toBeDeleted.length; i++)
        it('Should return true', ()=>{
            assert.equal(storage.delete(keys[i]), true);
        })
});

describe('Testing deleted keys reading', ()=>{
    for(let i = 0; i < toBeDeleted.length; i++)
        it('Should return "Key does not exist"', ()=>{
            assert.equal(storage.read(keys[i]), "Key does not exist");
        })
});

describe('Testing time to live property', ()=>{
    console.log("Creating a key with 0 second time to live");
    storage.create("Temp", {"temp" : 0}, 0);
    
    it('Should return "Key has been expired"', ()=>{
        assert.equal(storage.read("Temp"), "Key has been expired");
    })
});