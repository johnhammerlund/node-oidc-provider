const assert = require('assert');
const querystring = require('querystring');

const raw = require('raw-body');

const attention = require('../helpers/attention');
const { InvalidRequest } = require('../helpers/errors');

let warned;

module.exports = function getSelectiveBody(only) {
  assert(only, 'only must be provided');

  return async function selectiveBody(ctx, next) {
    if (ctx.is(only)) {
      try {
        const body = await (() => {
          if (ctx.req.readable) {
            return raw(ctx.req, {
              length: ctx.length,
              limit: '56kb',
              encoding: ctx.charset,
            });
          }
          if (!warned) {
            warned = true;
            /* eslint-disable no-multi-str */
            attention.warn('already parsed request body detected, having upstream middleware parser \
is not recommended, resolving to use req.body or request.body instead');
            /* eslint-enable */
          }

          return ctx.req.body || ctx.request.body;
        })();

        if (body instanceof Buffer || typeof body === 'string') {
          if (only === 'application/json') {
            ctx.oidc.body = JSON.parse(body);
          } else {
            ctx.oidc.body = querystring.parse(String(body));
          }
        } else {
          ctx.oidc.body = body;
        }
      } catch (err) {
        throw new InvalidRequest('couldnt parse the request body');
      }

      await next();
    } else {
      const msg = `only ${only} content-type ${ctx.method} bodies are supported`;
      throw new InvalidRequest(msg);
    }
  };
};
