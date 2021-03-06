const _ = require('lodash');

const { InvalidRequest } = require('./errors');

module.exports = function validatePresence(ctx, required) {
  const missing = _.difference(required, _.keys(_.omitBy(ctx.oidc.params, _.isUndefined)));

  if (!_.isEmpty(missing)) {
    throw new InvalidRequest(`missing required parameter(s). (${missing.join(',')})`);
  }
};
