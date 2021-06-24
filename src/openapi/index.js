/**
 * Script to fetch openapi.json from kuroco-dev
 */
const config = require('../../openapi.config.js');
const kurocoApi = require('../utils/KurocoApi.js');
const fs = require('fs');

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const OUTPUT = process.env.OUTPUT || './openapi.json';
if (!EMAIL || !PASSWORD) {
  console.error('[Error] email and password must be set');
  process.exit(1);
}

const target = process.argv[2];
const apiId = process.argv[3];
if (config[target] === undefined) {
  console.error('[Error] configuration for specified target not found');
  process.exit(1);
}
const api_config = config[target].find((conf) => conf.API_ID == apiId);
if (api_config === undefined) {
  console.error('[Error] configuration for specified api_id not found');
  process.exit(1);
}

const {
  ROOT_API_URL,
  API_ID,
  ENDPOINT_LOGIN,
  ENDPOINT_TOKEN,
  ENDPOINT_OPENAPI,
} = api_config;

(async () => {
  // Login
  const login_response = await kurocoApi.post({
    url: `${ROOT_API_URL}${ENDPOINT_LOGIN}`,
    body: { email: EMAIL, password: PASSWORD },
  });
  if (kurocoApi.hasErrors(login_response)) {
    console.error(`[Error] ` + JSON.stringify(login_response));
    process.exit(1);
  }

  // Fetch access token
  const token_response = await kurocoApi.post({
    url: `${ROOT_API_URL}${ENDPOINT_TOKEN}`,
    body: { grant_token: login_response.grant_token },
  });
  if (kurocoApi.hasErrors(token_response)) {
    console.error(`[Error] ` + JSON.stringify(token_response));
    process.exit(1);
  }

  // Get openapi data
  const openapi_response = await kurocoApi.get({
    url: `${ROOT_API_URL}${ENDPOINT_OPENAPI}?api_id=${API_ID}&lang=en`,
    accessToken: token_response.access_token.value,
  });
  if (kurocoApi.hasErrors(openapi_response)) {
    console.error(`[Error] ` + JSON.stringify(openapi_response));
    process.exit(1);
  }

  // Save
  const openapi_json = JSON.stringify(openapi_response.openapi_data, null, 4);
  fs.writeFile(OUTPUT, openapi_json, (err) => {
    if (err) {
      console.error(`[Error] ` + err);
      process.exit(1);
    } else {
      console.log(`[Suceess] output file: ${OUTPUT}`);
    }
  });
})();
