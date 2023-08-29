// Import base
const { ObjectId } = require("mongodb");

// Import model
const Transaction = require("../models/transaction");

// Import util
const paging = require("../utils/paging");

// Hàm cập nhập trạng thái giao dịch
const updateTransactionStatus = async () => {
  try {
    // Lấy tất cả các giao dịch trong csdl
    const trans = await Transaction.find();

    // Cập nhật trạng thái các giao dịch
    trans.forEach(async (tran) => {
      // Chuyển đổi ngày thành thời gian (đơn vị: ms)
      const curDate = new Date().getTime();
      const staDate = new Date(tran.startDate).getTime();
      const endDate = new Date(tran.endDate).getTime() + 24 * 60 * 60 * 1000;

      // Trạng thái phòng là đã đặt
      if (curDate < staDate) {
        await Transaction.findByIdAndUpdate(tran._id, {
          status: "Booked",
        });
      }
      // Trạng thái phòng là đã nhận phòng
      else if (curDate < endDate) {
        await Transaction.findByIdAndUpdate(tran._id, {
          status: "Check in",
        });
      }
      // Trạng thái phòng là đã trả phòng
      else {
        await Transaction.findByIdAndUpdate(tran._id, {
          status: "Check out",
        });
      }
    });
    // Xử lý lỗi
  } catch (error) {
    console.log(error);
  }
};

exports.updateTransactionStatus = updateTransactionStatus;

// POST - /api/transaction/create-transaction
exports.postCreateTransaction = (req, res, next) => {
  // Tạo response data
  const resData = {};

  // Lấy dữ liệu giao dịch từ yêu cầu POST:
  const rooms = req.body.rooms;
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);
  const price = Number(req.body.price);
  const payment = req.body.payment;
  const status = req.body.status;
  let user;
  let hotel;

  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (!req.session.user) {
    resData.type = "Error";
    resData.message = "You need to login to create transaction";
    return res.status(400).json(resData);
  }

  // Thử chuyển đổi chuỗi id thành đối tượng ObjectId
  try {
    user = new ObjectId(req.session.user._id);
    hotel = new ObjectId(req.body.hotel);
  } catch (err) {
    // If catch error
    console.log(err);
    resData.type = "Error";
    resData.message = "Invalid id";
    return res.status(400).json(resData);
  }

  //Lưu trữ dữ liệu đầu vào trong đối tượng resData
  resData.input = {
    user,
    hotel,
    rooms,
    startDate,
    endDate,
    price,
    payment,
    status,
  };

  // Tạo giao dịch mới trong database
  Transaction.create({
    user,
    hotel,
    rooms,
    startDate,
    endDate,
    price,
    payment,
    status,
  })
    // Trả về trạng thái thành công
    .then(() => {
      resData.type = "Success";
      resData.message = "Create transaction successfully";
      return res.json(resData);
    })
    // Xử lý lỗi
    .catch((err) => {
      console.log(err);
      resData.type = "Error";
      resData.message = "Some error occurs in server - " + err.toString();
      return res.status(500).json(resData);
    });
};

// GET - /api/transaction/get-by-user-id/:userId
exports.getTransactionsByUserId = async (req, res, next) => {
  // Khởi tạo đối tượng resData để lưu trữ dữ liệu phản hồi
  const resData = {};

  // Lấy userId từ các tham số của yêu cầu
  const userId = req.params.userId;

  try {
    //Thử cập nhật trạng thái của các giao dịch dựa trên ngày hiện tại bằng cách gọi hàm updateTransactionStatus()
    await updateTransactionStatus();

    // Lấy danh sách các giao dịch của người dùng có userId
    const trans = await Transaction.find({
      user: new ObjectId(userId),
    })
      //Đồng bộ hóa các trường hotel và user trong các giao dịch để lấy thông tin chi tiết của khách sạn và người dùng sau đó
      //thực hiện truy vấn để lấy danh sách các giao dịch.
      .populate(["hotel", "user"])
      .exec();

    // Send sucesss response 
    resData.type = "Success";
    //Gán danh sách các giao dịch vào trường items trong dữ liệu phản hồi.
    resData.items = trans;
    return res.json(resData);

    // Xử lý lỗi nếu có
  } catch (error) {
    console.log(error);
    resData.type = "Error";
    resData.message = "Some errors in server - " + error.toString();
    return res.status(500).json(resData);
  }
};

// GET - /api/transaction/get-latest
exports.getLatestTransactions = async (req, res, next) => {
  // Response data
  let resData = {};

  // Lấy số lượng giao dịch mà khách hàng muốn lấy nếu không có tham số limit trong query, mặc định giá trị là 1000.
  const limit = Number(req.query.limit) || 1000;
  // Lấy trang hiện tại nếu không có tham số page trong query, mặc định giá trị là 1.
  const page = Number(req.query.page) || 1;
  // Get page size Nếu không có tham số pageSize trong query, mặc định giá trị là 8
  const pageSize = Number(req.query.pageSize) || 8;

  try {
    // Thử cập nhật trạng thái của các giao dịch dựa trên ngày hiện tại bằng cách gọi hàm updateTransactionStatus()
    updateTransactionStatus();

    // Lấy danh sách các giao dịch và sắp xếp theo startDate giảm dần
    const trans = await Transaction.find()
      //Đồng bộ hóa các trường user và hotel trong các giao dịch để lấy thông tin chi tiết của người dùng và khách sạn. Sắp xếp các giao dịch theo startDate giảm dần và endDate giảm dần.
      //và giới hạn số lượng giao dịch lấy ra
      .populate([{ path: "user" }, { path: "hotel" }])
      .sort({ startDate: -1, endDate: -1 })
      .limit(limit);

    // Phân trang kết quả
    const paged = paging(trans, page, pageSize);

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

// GET - /api/transaction/count
exports.getTransactionsCount = async (req, res, next) => {
  // Response data
  let resData = {};

  try {
    // Get transactions count
    const transCount = await Transaction.countDocuments({});

    // Send response
    resData.item = { transCount };
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

// GET - /api/transaction/earnings
//Hàm để lấy thông tin về tổng thu nhập và tổng thời gian của tất cả các giao dịch.
exports.getEarnings = async (req, res, next) => {
  // Response data
  let resData = {};

  try {
    // Get all transactions
    const trans = await Transaction.find();
    //Lấy giao dịch cuối cùng dựa trên startDate giảm dần
    const lastTran = await Transaction.findOne().sort("-startDate").limit(1);
    //Lấy giao dịch đầu tiên dựa trên startDate tăng dần
    const firstTran = await Transaction.findOne().sort("startDate").limit(1);

    // Tính tổng thu nhập bằng cách tính tổng giá của tất cả các giao dịch
    const totalEarnings = trans.reduce((total, tran) => total + tran.price, 0);
    // Tính tổng thời gian bằng cách lấy hiệu của thời gian của giao dịch cuối cùng và thời gian của giao dịch đầu tiên (dưới dạng millisecond):
    const totalTime =
      lastTran && firstTran
        ? new Date(lastTran.startDate).getTime() -
        new Date(firstTran.startDate).getTime()
        : 0;

    // Send response
    // Gán tổng thu nhập và tổng thời gian vào trường item trong dữ liệu phản hồ
    resData.item = { totalEarnings, totalTime };
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
