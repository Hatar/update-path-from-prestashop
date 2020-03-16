const fs = require('fs');
const path = require("path");
const glob = require('glob');
const replace = require('replace-in-file');
const mysql = require('mysql');
const prompt = require('prompt-sync')();


if(false) {

    con.connect(function (err) {
        if (err) {
            return console.error('error: ' + err.message);
        }
        console.log('Connected to the MySQL server.');
        con.query("SELECT `physical_uri` FROM `ps_shop_url`", (err, res) => {
            Object.keys(res).forEach(function (key) {
                var row = res[key],
                    oldUrl = row.physical_uri;
                start_cli(oldUrl)
            })
        });

        function start_cli(oldUrl) {
            oldUrl = oldUrl.replace('/', '');
            oldUrl = oldUrl.substring(0, oldUrl.length - 1);
            let physical_uri = user_input('Give me name url ?', oldUrl);
            if (physical_uri !== oldUrl) {
                /***************** Update Table ps_shop_url  ********/
                var sql1 = "UPDATE `ps_shop_url` SET `physical_uri` = ? WHERE `id_shop_url`=? LIMIT 1";
                let data = ['/' + physical_uri.trim() + '/', 1];
                /***************** execute the UPDATE statement  *******/
                con.query(sql1, data, (error, results) => {
                    if (error) {
                        return console.error(error.message);
                    }
                    console.log('Rows affected:', results.affectedRows);
                });
            } else {
                console.log('there\'s no Change')
            }
            con.end();
            fs.readFile('.htaccess', 'utf8', function (err, data) {
                if (err) throw err;
                const regex1 = /(RewriteRule \. - \[E=REWRITEBASE:\/)(.*)(\/])/gm,
                    regex2 = /(ErrorDocument 404 \/)(.*)(\/index\.php\?controller=404)/gm,
                    subst = '$1' + physical_uri + '$3',
                    replace_first = data.replace(regex1, subst),
                    content = replace_first.replace(regex2, subst);
                fs.writeFile('.htaccess', content, (err, content) => {
                    if (err) return console.log(err);
                })
            })
            /********************  Function Get All Files using glob ******/
            var directories = function (src, calb) {
                glob(src, {
                    realpath: true
                }, calb);
            };

            /***************** Call Func  **************************/
            directories('test/**/*', function (err, path) {
                if (err) throw  err;

                path.forEach(function (file) {
                    console.log((file));
                });
                /**************** Get Content File   *********************/
                var content = fs.readFileSync(path[0], 'utf8');
                /*********** Replace in single file ******************/
                const options = {
                    files: path,
                    from: oldUrl,
                    to: physical_uri,
                };
                replace(options).then(res => console.log(res)).catch(err => console.error(err))
            });
        }
    });

}

// -----------------------------------------
const connect_mysql = function(fn){
    user_input = (question, value) => (prompt(question + " [" + value + "] ") || value).trim();
    let config = {
        host: user_input("Give me your host ?", 'localhost'),
        user: user_input("Give me your user ?", 'root'),
        password: user_input("Give me your password ?", ''),
        database: user_input("Give me your database ?", 'presta_iwim')
    };
    var con = mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database
    });
    con.connect(function(err) {
        if (err) {
            return console.error('error: ' + err.message);
        }
        console.log('Connected to the MySQL server.');
        fn();
    });
};

const get_user_input = function(user_input){
    user_input();
};

var change_db = function(){};
var change_files = function(){};
var change_htaccess = function(){};
// -------------------------

connect_mysql(function(){

    console.log("ok");

    get_user_input();

});


