const prompt = require('prompt-sync')();
const mysql = require('mysql');
const fs = require('fs');
const path = require("path");
const glob = require('glob');
const sleep = require('sleep');
const replace = require('replace-in-file');
const rimraf = require("rimraf");
// ---------------------------------------------------------------------------------------------------------------------
const connect_mysql     =  function(config, fn){
    let con = mysql.createConnection(config);
    con.connect(function(err) {
        if (err) return console.error('error: ' + err.message);
        con.query("SELECT `physical_uri` FROM `ps_shop_url`", (err, res) => {
            Object.keys(res).forEach(function (key) {
                let row = res[key];
                let oldUrl = row.physical_uri;
                oldUrl = oldUrl.replace(/(^\/+|\/+$)/g, '');
                fn(con,oldUrl);

            })
        });
    });
}
const change_htaccess   =  function(newURL){
    fs.readFile('.htaccess', 'utf8', function (err, data) {
        if (err) throw err;
        const regex1 = /(RewriteRule \. - \[E=REWRITEBASE:\/)(.*)(\/])/gm,
            regex2 = /(ErrorDocument 404 \/)(.*)(\/index\.php\?controller=404)/gm,
            subst = '$1' + newURL + '$3',
            replace_first = data.replace(regex1, subst),
            content = replace_first.replace(regex2, subst);
        fs.writeFile('.htaccess', content, (err, content) => {
            if (err) return console.log(err);
        })
    })
}
const change_db         =  function(con,newURL){
    let sql1 = "UPDATE `ps_shop_url` SET `physical_uri` = ? WHERE `id_shop_url`=? LIMIT 1";
    let data = ['/' + newURL.trim() + '/', 1];
    con.query(sql1, data, (error, results) => {
        if (error) return console.error(error.message);
        console.log('Rows affected:', results.affectedRows);
    });
}
const clean_cache       =  function(){

    try{ rimraf("var/cache_pending_delete"); }catch(e){}
    fs.rename('var/cache', 'var/cache_pending_delete', function(err) {
        if (err) return;
        rimraf("var/cache_pending_delete", function () { console.log("cache is cleared"); });
    });

    return new Promise(resolve => {
        sleep.sleep(3);
        resolve('resolved');
    });
}


const consoleWrap = function(fn){
    console.log("--------------------");
    fn();
    console.log("--------------------");
}
user_input = (question, value) => (prompt(question + " [" + value + "] ") || value).trim();
function onSuccess () {
    console.log('Success!')
}
function onError () {
    console.log('Error')
}
// ---------------------------------------------------------------------------------------------------------------------
const inputs = {};
inputs.host         = user_input("Give me your MySQL host ?", 'localhost');
inputs.user         = user_input("Give me your MySQL user ?", 'root');
inputs.password     = user_input("Give me your MySQL password ?", '');
inputs.database     = user_input("Give me your MySQL database ?", 'presta_iwim');
connect_mysql(inputs,function(con, oldURL) {
    let newUrl = null;
    consoleWrap(function(){
        console.log('We found the old URL to be: ' + oldURL);
        inputs.url = newUrl = user_input('Give me the new URL ?', oldURL);
    });
    change_htaccess(newUrl);
    change_db(con, newUrl);
    clean_cache();
});

