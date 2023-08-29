// Import base
const { ObjectId } = require("mongodb");

// Import model
const Hotel = require("../models/hotel");
const Room = require("../models/room");
const Transaction = require("../models/transaction");

// Import util
const paging = require("../utils/paging");
const { updateTransactionStatus } = require("./transaction");

// GET - /api/room/get-all
exports.getAllRooms = async (req, res, next) => {
  // Dữ liệu phản hồi
  let resData = {};

  // Lấy số lượng phòng mà client muốn lấy
  const limit = Number(req.query.limit) || 100;
  // Lấy trang
  const page = Number(req.query.page) || 1;
  // Lấy kích thước trang
  const pageSize = Number(req.query.pageSize) || 100;

  try {
    // Lấy tất cả các phòng
    const rooms = await Room.find().limit(limit);

    // Phân trang các mục
    const paged = paging(rooms, page, pageSize);

    // Gửi phản hồi
    resData = paged;
    resData.type = "Success";
    return res.json(resData);

    // Nếu xảy ra lỗi
  } catch (error) {
    console.log(error);
    resData.type = "Error";
    resData.message = "Some errors in server - " + error.toString();
    return res.status(500).json(resData);
  }
};

// GET - /api/room/get-by-id
exports.getRoomById = (req, res, next) => {
  // Tạo đối tượng dữ liệu phản hồi
  const resData = {};

  // Lấy giá trị hotelId từ truy vấn (query)
  const roomId = req.query.roomId;

  // Gửi truy vấn về cho client
  resData.query = { roomId };

  // Lấy thông tin phòng
  Room.findById(roomId)
    .then((room) => {
      // Nếu không tìm thấy phòng với id đã cho
      if (!room) {
        resData.type = "Error";
        resData.message = "No room found";
        return res.status(404).json(resData);
      }

      // Gửi dữ liệu về cho client
      resData.type = "Success";
      resData.item = room;
      res.json(resData);
    })
    // Nếu xảy ra lỗi
    .catch((err) => {
      console.log(err);
      resData.type = "Error";
      resData.message = "Some errors occur in the server: " + err.toString();
      return res.status(500).json(resData);
    });
};

// GET - /api/room/get-non-attached
exports.getNonAttachedRooms = async (req, res, next) => {
  // Dữ liệu phản hồi
  const resData = {};

  // Lấy danh sách phòng và khách sạn, sau đó lấy danh sách phòng chưa được gắn kết
  try {
    // Lấy danh sách khách sạn và phòng
    const hotels = await Hotel.find({}, "rooms");
    const rooms = await Room.find();

    // Giảm số lượng phòng đã được gắn kết từ danh sách khách sạn
    let attached = hotels.reduce((arr, hotel) => [...arr, ...hotel.rooms], []);

    // Chuyển đổi tất cả các ID phòng thành chuỗi
    attached = attached.map((roomId) => roomId.toString());

    // Lọc từ danh sách phòng để lấy danh sách phòng chưa được gắn kết
    const nonAttached = rooms.filter(
      (room) => !attached.includes(room._id.toString())
    );

    // Gửi phản hồi
    resData.type = "Success";
    resData.items = nonAttached;
    return res.json(resData);

    // Nếu gặp lỗi
  } catch (error) {
    console.log(error);
    resData.type = "Error";
    resData.message = "Some errors in server - " + error.toString();
    return res.status(500).json(resData);
  }
};

// POST - /api/room/create
exports.postCreateRoom = async (req, res, next) => {
  // Dữ liệu phản hồi
  const resData = {};

  // Lấy dữ liệu
  const roomData = req.body.room;
  const hotelId = req.body.hotelId;

  try {
    if (hotelId !== "") {
      // Lấy thông tin của khách sạn có ID tương ứng bằng cách sử dụng phương thức findById() của mô hình Hotel. Phương thức 
      //populate("rooms") được sử dụng để lấy thông tin chi tiết của thuộc tính rooms trong khách sạn.
      const hotel = await Hotel.findById(hotelId).populate("rooms");

      // Lấy danh sách số phòng, Phương thức reduce() được sử dụng để giảm danh sách các phòng thành một mảng roomNumbers chứa tất cả số phòng trong khách sạn.
      const roomNumbers = hotel.rooms.reduce(
        (rns, room) => [...rns, ...room.roomNumbers],
        []
      );

      // Lọc số phòng trùng lặp
      const duplicateRoomNumbers = [];
      roomData.roomNumbers.forEach((rn) => {
        //Kiểm tra xem số phòng có tồn tại trong danh sách số phòng của khách sạn hay không. Nếu tồn tại, số phòng đó được thêm vào mảng duplicateRoomNumbers.
        if (roomNumbers.includes(rn)) duplicateRoomNumbers.push(rn);
      });

      // Nếu có số phòng trùng lặp trả về một phản hồi lỗi với mã HTTP 400 và thông báo lỗi tương ứng.
      if (duplicateRoomNumbers.length > 0) {
        resData.type = "Error";
        resData.message = `Room number ${duplicateRoomNumbers.join(
          ", "
        )} already exists in ${hotel.name
          } hotel, please enter another room number.`;
        return res.status(400).json(resData);
      }
    }

    // Tạo một đối tượng phòng mới bằng cách sử dụng phương thức create() của model Room. Dữ liệu phòng được lấy từ roomData.
    const room = await Room.create(roomData);
    if (hotelId !== "")
      //Nếu ID khách sạn tồn tại, thực hiện cập nhật khách sạn bằng cách thêm ID của phòng mới vào mảng rooms của khách sạn
      await Hotel.findByIdAndUpdate(hotelId, { $push: { rooms: room._id } });

    // Trả về một phản hồi thành công với dữ liệu resData dạng JSON.
    resData.type = "Success";
    resData.message = "Create room successfully";
    return res.json(resData);

    // Nếu gặp lỗi
  } catch (error) {
    console.log(error);
    resData.type = "Error";
    resData.message = "Some errors in server - " + error.toString();
    return res.status(500).json(resData);
  }
};

// POST - /api/room/update-by-id
exports.postUpdateRoomById = async (req, res, next) => {
  // Dữ liệu phản hồi
  const resData = {};

  // Lấy dữ liệu  từ yêu cầu HTTP được gửi bởi client.
  const roomData = req.body.room;
  const hotelId = req.body.hotelId;
  const preHotelId = req.body.preHotelId;

  try {
    //Kiểm tra xem có tồn tại ID của khách sạn mới và khác với ID của khách sạn cũ hay không
    if (hotelId !== "" && hotelId !== preHotelId) {
      // Lấy thông tin của khách sạn mới có ID tương ứng, Phương thức populate("rooms") được 
      //sử dụng để lấy thông tin chi tiết của thuộc tính rooms trong khách sạn mới.
      const hotel = await Hotel.findById(hotelId).populate("rooms");
      //Lấy thông tin của khách sạn cũ chứa phòng có ID tương ứng. Thuộc tính rooms trong khách sạn cũ 
      //được tìm kiếm bằng cách so sánh với ID của phòng được cập nhật (roomData._id).
      const prevHotel = await Hotel.findOne({
        rooms: new ObjectId(roomData._id),
      });

      // Lấy danh sách số phòng
      const roomNumbers = hotel.rooms.reduce(
        (rns, room) => [...rns, ...room.roomNumbers],
        []
      );

      // Lọc số phòng trùng lặp
      const duplicateRoomNumbers = [];
      //Kiểm tra xem số phòng hiện tại có tồn tại trong danh sách roomNumbers của khách sạn mới hay không.Nếu có, số phòng đó được thêm vào mảng duplicateRoomNumbers.
      roomData.roomNumbers.forEach((rn) => {
        if (roomNumbers.includes(rn)) duplicateRoomNumbers.push(rn);
      });

      // Nếu có số phòng trùng lặp
      if (duplicateRoomNumbers.length > 0) {
        resData.type = "Error";
        resData.message = `Room number ${duplicateRoomNumbers.join(
          ", "
        )} already exists in ${hotel.name
          } hotel, please enter another room number.`;
        return res.status(400).json(resData);
      }
    }

    // Nếu mọi thứ đều ổn, cập nhật phòng và thêm vào khách sạn
    const room = await Room.findByIdAndUpdate(roomData._id, roomData);
    // Xóa khỏi khách sạn cũ
    if (preHotelId !== "")
      await Hotel.findByIdAndUpdate(preHotelId, { $pull: { rooms: room._id } });
    // Thêm vào khách sạn mới
    if (hotelId !== "")
      await Hotel.findByIdAndUpdate(hotelId, { $push: { rooms: room._id } });

    // Gửi phản hồi
    resData.type = "Success";
    resData.message = "Update room successfully";
    return res.json(resData);

    // Nếu gặp lỗi
  } catch (error) {
    console.log(error);
    resData.type = "Error";
    resData.message = "Some errors in server - " + error.toString();
    return res.status(500).json(resData);
  }
};

// POST - /api/room/delete-by-id
exports.postDeleteRoomById = async (req, res, next) => {
  // Khởi tạo đối tượng resData để lưu trữ dữ liệu phản hồi
  const resData = {};

  // Lấy roomId từ yêu cầu POST
  const roomId = req.body.roomId;

  try {
    // cập nhật trạng thái của giao dịch
    await updateTransactionStatus();

    // Lấy thông tin khách sạn (hotel) chứa phòng cần xóa
    const hotel = await Hotel.findOne({ rooms: new ObjectId(roomId) }).populate(
      "rooms"
    );

    // Lấy thông tin phòng cần xóa từ danh sách phòng của khách sạn
    const room = hotel.rooms.find((room) => room._id.toString() === roomId);

    // Lấy danh sách giao dịch có trạng thái "Check in" hoặc "Booked" của khách sạn
    const trans = await Transaction.find({
      hotel: hotel._id,
      $or: [{ status: "Check in" }, { status: "Booked" }],
    });

    // Lấy danh sách số phòng của các giao dịch đó
    const roomNumbers = trans.reduce(
      (rns, tran) => [...rns, ...tran.rooms],
      []
    );

    //Kiểm tra xem phòng cần xóa có số phòng nằm trong danh sách số phòng đã thuê hay không
    if (room.roomNumbers.some((rn) => roomNumbers.includes(rn))) {
      resData.type = "Error";
      resData.message =
        "This room cannot be deleted because it is currently rented.";
      return res.status(400).json(resData);
    }

    // Nếu không có lỗi, xóa phòng khỏi danh sách phòng của khách sạn
    await Hotel.findByIdAndUpdate(hotel._id, {
      $pullAll: { rooms: [room._id] },
    });

    // Xóa phòng khỏi cơ sở dữ liệu
    await Room.findByIdAndDelete(room._id);

    // Gửi phản hồi thành công
    resData.type = "Success";
    resData.message = "Delete room successfully";
    return res.json(resData);

    // Xử lý lỗi nếu có
  } catch (error) {
    resData.type = "Error";
    resData.message = "Some error occur in server - " + error.toString();
    return res.status(500).json(resData);
  }
};
