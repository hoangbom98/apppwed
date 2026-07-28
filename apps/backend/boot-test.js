require('dotenv/config');

// Intercept missing modules
var Module = require('module');
var orig = Module._resolveFilename;
Module._resolveFilename = function(req, parent) {
  try { return orig.apply(this, arguments); }
  catch(e) {
    if (!req.match(/bufferutil|utf-8-validate|canvas|sharp/)) {
      process.stderr.write('MISSING: '+req+'\n  from: '+
        (parent&&parent.filename||'').replace('/var/LKVIP/apps/backend/dist/src/','[dist]/')+'\n');
    }
    throw e;
  }
};

process.on('uncaughtException', function(e) {
  process.stderr.write('CRASH: '+e.message+'\n'+e.stack+'\n');
  process.exit(1);
});
process.on('unhandledRejection', function(r) {
  process.stderr.write('REJECT: '+String(r instanceof Error ? r.stack : r)+'\n');
  // Don't exit — some rejections are non-fatal
});

require('/var/LKVIP/apps/backend/dist/server.js');
