function json(data, pretty) {
  const text = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  process.stdout.write(text + '\n');
}

function error(payload, pretty) {
  const envelope = {
    error: true,
    code: payload.code || 'REQUEST_FAILED',
    message: payload.message || 'Request failed',
    details: payload.details || {}
  };

  const text = pretty ? JSON.stringify(envelope, null, 2) : JSON.stringify(envelope);
  process.stderr.write(text + '\n');
}

module.exports = {
  json,
  error
};
