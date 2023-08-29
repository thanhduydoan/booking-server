// Import model
const User = require("../models/user");

// Import util
const paging = require("../utils/paging");

// GET - /api/user/get-all
exports.getAllUsers = async (req, res, next) => {
  // Response data
  let resData = {};

  // Get number of users client want to get
  const limit = Number(req.query.limit) || 1000;
  // Get page
  const page = Number(req.query.page) || 1;
  // Get page size
  const pageSize = Number(req.query.pageSize) || 8;

  try {
    // Get all users
    const users = await User.find().sort("-isAdmin").limit(limit);

    // Paging items
    const paged = paging(users, page, pageSize);

    // Send response
    resData = paged;
    resData.type = "Success";
    return res.json(resData);

    // If catch error
  } catch (error) {
    console.log(error);
    resData.type = "Error";
    resData.message = "Some errors in server - " + error.toString();
    return res.status(500).json(resData);
  }
};

// GET - /api/user/count
exports.getUsersCount = async (req, res, next) => {
  // Response data
  let resData = {};

  try {
    // Get all users
    const usersCount = await User.countDocuments({});

    // Send response
    resData.item = { usersCount };
    resData.type = "Success";
    return res.json(resData);

    // If catch error
  } catch (error) {
    console.log(error);
    resData.type = "Error";
    resData.message = "Some errors in server - " + error.toString();
    return res.status(500).json(resData);
  }
};
