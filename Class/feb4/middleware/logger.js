const logger = (req, res, next) => {
    console.log(req.url);
    console.log(req.method);
    console.log(req.headers);
    console.log(Date());
    next();
  };

  export default logger;