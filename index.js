var nodejieba = require("nodejieba");

var PouchDB = require('pouchdb');
var replicationStream = require('pouchdb-replication-stream');
PouchDB.debug.enable('*');
PouchDB.plugin(replicationStream.plugin);
PouchDB.adapter('writableStream', replicationStream.adapters.writableStream);
PouchDB.plugin(require('pouchdb-upsert'));

var _ = require('lodash');
var path = require('path');
var fs = require('fs');

var db = new PouchDB('searchindex');

module.exports = {
    book: {
        assets: './assets',
        js: [
            'lunr.min.js', 'search-lunr.js'
        ]
    },

    hooks: {
        'init': function () {
            // return db.destroy();
        },

        // Index each page
        'page': function(page) {
            if (this.output.name != 'website' || page.search === false) {
                return page;
            }

            var text;
            var url = this.output.toURL(page.path);

            this.log.debug.ln('index page', page.path);

            // Transform as TEXT
            text = page.content.replace(/(<([^>]+)>)/ig, '');

            // Add to index
            var doc = {
                url: this.output.toURL(page.path),
                title: page.title,
                summary: page.description,
                body: text
            };

            // 分词
            var words = _.uniq(nodejieba.cutForSearch(page.title + text, true));

            // 移除空格和 \n
            _.pull(words, ' ', '\n');

            function insertData(word) {
                console.log(word);
                word = word.toUpperCase();

                return db.upsert('word__' + word, function (doc) {
                    if (!doc.urls) {
                        doc.urls = [];
                    }
                    doc.urls = _.union(doc.urls, [url]);

                    return doc;
                }).then(function() {
                    // Insert new doc
                    return db.putIfNotExists(
                        {
                            _id: 'doc__' + doc.url,
                            doc: doc
                        }
                    );
                });
            }

            return Promise.all(words.map(insertData)).then(function () {
                return page;
            });

        },

        // Write index to disk
        'finish': function() {
            if (this.output.name != 'website') return;

            var file_path = path.resolve(this.output.root(), 'search_jieba_index.dat');

            var ws = fs.createWriteStream(file_path);

            // dump db for browser to load
            return db.dump(ws).catch(function (err) {
                console.log(err);
            });
        }
    }
};

