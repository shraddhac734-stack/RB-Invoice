const axios = require("axios");
async function callApi({
  url,
  method = "GET",
  data = null,
  headers = {},
  params = {},
  timeout = 30000,
}) {
  try {
    const response = await axios({
      url,
      method,
      data,
      headers,
      params,
      timeout,
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // Remote server responded with an error HTTP status
      const status = error.response.status;
      const remoteMessage =
        error.response.data?.message ||
        error.response.statusText ||
        "External API error";
      const apiError = new Error(
        `Remote API returned HTTP ${status}: ${remoteMessage}`,
      );
      apiError.statusCode = status;
      apiError.remoteData = error.response.data;
      throw apiError;
    } else if (error.code === "ECONNABORTED") {
      const timeoutError = new Error(
        `External API request timed out after ${timeout}ms`,
      );
      timeoutError.statusCode = 504;
      throw timeoutError;
    } else {
      // Network failure or connection error
      const netError = new Error(
        `Failed to reach external API: ${error.message}`,
      );
      netError.statusCode = 502;
      throw netError;
    }
  }
}

module.exports = {
  callApi,
};
