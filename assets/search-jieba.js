window.require([
   'gitbook',
   'jquery'
], function(gitbook, $) {

    // Define global search engine
    function JiebaSearchEngine() {
        this.store = {};
        this.name = 'JiebaSearchEngine';

        this.db = new PouchDB('searchindex');
    }

    // Initialize jieba by fetching the search index and load it into browser's IndexedDB
    JiebaSearchEngine.prototype.init = function() {
        var that = this;
        var d = $.Deferred();

        this.db.load(gitbook.state.basePath+'/search_jieba_index.dat').then(function () {
            d.resolve();
        }).catch(function (err) {
            d.reject(err);
        });

        return d.promise();
    };

    // Search for a term and return results
    JiebaSearchEngine.prototype.search = function(q, offset, length) {
        var that = this;
        var results = [];
        var d = $.Deferred();

        // Query local db
        this.db.allDocs(
            {
                include_docs: true,
                keys: $.map(q.toUpperCase().split(' '), function (val) {
                    if (val.length == 0) {
                        return null;
                    }
                    return 'word__' + val;
                })
            }
        ).then(function (result) {
            return $.unique($.map(result.rows, function (row) {
                if (row.doc) {
                    // the row contains the query word
                    return row.doc.urls;
                }
            }));
        }).then(function (urls) {
            return that.db.allDocs(
                {
                    include_docs: true,
                    keys: $.map(urls, function (val) {
                        return 'doc__' + val;
                    })
                }
            )
        }).then(function (result) {
            var results = $.map(result.rows, function (row) {
                if (row.doc) {
                    // the row contains doc
                    return {
                        title: row.doc.doc.title,
                        url: row.doc.doc.url,
                        body: row.doc.doc.summary || row.doc.doc.body
                    };
                }
            });

            d.resolve(
                {
                    query: q,
                    results: results.slice(0, length),
                    count: results.length
                }
            );
        });

        return d.promise();
    };

    // Set gitbook research
    gitbook.events.bind('start', function(e, config) {
        gitbook.search.setEngine(JiebaSearchEngine, config);
    });
});