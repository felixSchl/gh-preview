var Promise = require('bluebird')
  , _       = require('lodash')
  , request = Promise.promisifyAll(require('request'))
  , fs      = Promise.promisifyAll(require('fs'))
;

/**
 * Create a request generator.
 * String -> Number -> Number -> Promise StatusCode
 */
var mkGenerator = _.curry(function(content, concurrency, offset) {
    return Promise.all(
        _.map(_.range(concurrency), function(i) {
            return request
                .postAsync(
                        'http://127.0.0.1:1234/input'
                    , { json: {
                          title: offset * concurrency * (i + 1)
                        , content: content } }
                )
                .spread(_.partialRight(_.result, 'statusCode'))
                .catch(_.constant({}))
        })
    );
});

/**
 * Perform infinite amount of requests in paced sets.
 */
var run = function(concurrency, delay) {
    fs.readFileAsync('./bigReadme.md')
        .then(_.method('toString', 'utf-8'))
        .then(_.partial(mkGenerator, _, concurrency))
        .then(function (generateRequest) {
            return ((function rec(i) {
                console.log(
                    'Making ' + concurrency + ' concurrent requests (' + i + ')'
                );
                return generateRequest(i)
                    .delay(delay)
                    .then(_.partial(rec, i + 1))
                ;
            })(0));
        })
    ;
};

run(10, 10);
