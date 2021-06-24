const fetch = require('node-fetch');
class KurocoApi {
  static async post({ url, body, accessToken = '' }) {
    return await fetch(url, {
      method: 'POST',
      headers: this.makeHeaders(accessToken),
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .catch((err) => err);
  }
  static async get({ url, accessToken = '' }) {
    return await fetch(url, {
      method: 'GET',
      headers: this.makeHeaders(accessToken),
    })
      .then((res) => res.json())
      .catch((err) => err);
  }
  static makeHeaders(accessToken = '') {
    const tokenHeader = accessToken
      ? { 'X-RCMS-API-ACCESS-TOKEN': accessToken }
      : {};
    return {
      'Content-Type': 'application/json',
      ...tokenHeader,
    };
  }
  static hasErrors(response) {
    return (
      typeof response !== 'object' ||
      (Array.isArray(response.errors) && response.errors.length > 0)
    );
  }
}
module.exports = KurocoApi;
