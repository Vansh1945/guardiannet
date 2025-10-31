const getServerBaseUrl = (req) => {
    return `${req.protocol}://${req.get("host")}`;
  };
  
  module.exports = { getServerBaseUrl };