// Import base
const { ObjectId } = require("mongodb");

// Import model
const Hotel = require("../models/hotel");
const Transaction = require("../models/transaction");

// Import util
const { compStandard, toStandard } = require("../utils/string");
const { groupBy } = require("../utils/array");
const paging = require("../utils/paging");
const { updateTransactionStatus } = require("./transaction");

// GET - /api/hotel/get-all
exports.getAllHotels = async (req, res, next) => {
  // Response data
  let resData = {};

  // Số lượng người dùng mà client muốn nhận
  const limit = Number(req.query.limit) || 100;
  // Get page
  const page = Number(req.query.page) || 1;
  // Get page size
  const pageSize = Number(req.query.pageSize) || 100;

  try {
    // Get all users
    const hotels = await Hotel.find().limit(limit);

    // Paging items
    const paged = paging(hotels, page, pageSize);

    // Get cheapest price
    paged.items = paged.items.map((item) => {
      const tmpItem = item.toObject();
      // tmpItem.cheapestPrice = getCheapestPrice(tmpItem);
      return tmpItem;
    });

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

// GET - /api/hotel/get-by-id
exports.getHotelById = (req, res, next) => {
  // Create response data
  const resData = {};

  // Get hotelId query
  const hotelId = req.query.hotelId;

  // Send back query to client
  resData.query = { hotelId };

  // Get hotel
  Hotel.findById(hotelId)
    .populate("rooms")
    .then((hotel) => {
      // If hotel with given id not found
      if (!hotel) {
        resData.type = "Error";
        resData.message = "No hotel found";
        return res.status(404).json(resData);
      }

      // Convert hotel to object
      const hotelObj = hotel.toObject();

      // Get cheapest price
      // hotelObj.cheapestPrice = getCheapestPrice(hotelObj);

      // Send data to client
      resData.type = "Success";
      resData.item = hotelObj;
      res.json(resData);
    })
    // If catch some error
    .catch((err) => {
      console.log(err);
      resData.type = "Error";
      resData.message = "Some errors occur in the server: " + err.toString();
      return res.status(500).json(resData);
    });
};

// GET - /api/hotel/count
exports.getHotelCount = (req, res, next) => {
  // Create response data
  const resData = {};

  // Valid groupBy list
  const validGroupBy = ["city", "type"];

  // Get groupBy query
  let groupBy = req.query.groupBy;

  // If query is not valid
  if (!validGroupBy.includes(groupBy)) groupBy = validGroupBy[0];

  // Set valid query to response data
  resData.query = { groupBy };

  // Get all hotels
  Hotel.find()
    .then((hotels) => {
      // Create count items
      const countItems = [];

      // If group by city
      if (groupBy === "city") {
        // Count hotels in Ha Noi
        countItems.push({
          name: "Ha Noi",
          count: hotels.filter((h) => compStandard(h.city, "Ha Noi")).length,
        });

        // Count hotels in Ho Chi Minh
        countItems.push({
          name: "Ho Chi Minh",
          count: hotels.filter((h) => compStandard(h.city, "Ho Chi Minh"))
            .length,
        });

        // Count hotels in Ha Noi
        countItems.push({
          name: "Da Nang",
          count: hotels.filter((h) => compStandard(h.city, "Da Nang")).length,
        });
      }

      // If group by type
      else if (groupBy === "type") {
        // Count hotels
        countItems.push({
          name: "Hotel",
          count: hotels.filter((h) => compStandard(h.type, "Hotel")).length,
        });

        // Count apartments
        countItems.push({
          name: "Apartment",
          count: hotels.filter((h) => compStandard(h.type, "Apartment")).length,
        });

        // Count resorts
        countItems.push({
          name: "Resort",
          count: hotels.filter((h) => compStandard(h.type, "Resort")).length,
        });

        // Count villas
        countItems.push({
          name: "Villa",
          count: hotels.filter((h) => compStandard(h.type, "Villa")).length,
        });

        // Count cabins
        countItems.push({
          name: "Cabin",
          count: hotels.filter((h) => compStandard(h.type, "Cabin")).length,
        });
      }

      // Set data end send response
      resData.type = "Success";
      resData.items = countItems;
      return res.json(resData);
    })
    // If catch some error
    .catch((err) => {
      console.log(err);
      resData.type = "Error";
      resData.message = "Some errors occur in the server: " + err.toString();
      return res.status(500).json(resData);
    });
};

// GET - /api/hotel/top-rate
exports.getHotelTopRate = (req, res, next) => {
  // Create response data
  const resData = {};

  // Get query
  const top = Number(req.query.top) || 3;
  resData.query = { top };

  // Tìm kiếm tất cả các khách sạn, điền thông tin về các phòng của khách sạn, sắp xếp theo đánh giá giảm dần, giới hạn số lượng khách sạn trả về
  Hotel.find()
    .find()
    .populate("rooms")
    .sort("-rating")
    .limit(top)
    .then((hotels) => {
      // Convert hotels to array of object
      const hotelsObj = hotels.map((hotel) => {
        // Convert hotel to object
        const hotelObj = hotel.toObject();
        // Get cheapest price
        // hotelObj.cheapestPrice = getCheapestPrice(hotelObj);
        // Return
        return hotelObj;
      });

      // Set and send response
      resData.type = "Success";
      resData.items = hotelsObj;
      return res.json(resData);
    })
    // If catch some error
    .catch((err) => {
      console.log(err);
      resData.type = "Error";
      resData.message = "Some errors occur in the server: " + err.toString();
      return res.status(500).json(resData);
    });
};

// POST - /api/hotel/create
exports.postCreateHotel = async (req, res, next) => {
  // Response data
  const resData = {};

  // Get hotel data
  const hotelData = req.body;
  console.log(hotelData)

  try {
    // Create hotel
    await Hotel.create(hotelData);

    // Send response
    resData.type = "Success";
    resData.message = "Create hotel successfully!";
    return res.json(resData);

    // If catch error
  } catch (error) {
    console.log(error);
    resData.type = "Error";
    resData.message = "Some errors in server - " + error.toString();
    return res.status(500).json(resData);
  }
};

// POST - /api/hotel/update-by-id
exports.postUpdateHotelById = async (req, res, next) => {
  // Response data
  const resData = {};

  // Get hotel data
  const hotelData = req.body;
  const hotelId = hotelData._id;
  delete hotelData.__v;
  delete hotelData._id;

  try {
    // Cập nhật thông tin của khách sạn trong cơ sở dữ liệu. Đối số đầu tiên là hotelId, 
    //đại diện cho ID của khách sạn cần cập nhật. Đối số thứ hai là hotelData, đại diện cho dữ liệu mới cần cập nhật.
    await Hotel.findByIdAndUpdate(hotelId, hotelData);

    // Send response
    resData.type = "Success";
    resData.message = "Update hotel successfully!";
    return res.json(resData);

    // If catch error
  } catch (error) {
    console.log(error);
    resData.type = "Error";
    resData.message = "Some errors in server - " + error.toString();
    return res.status(500).json(resData);
  }
};

// POST - /api/hotel/search
exports.postHotelSearch = async (req, res, next) => {
  // Create response data
  const resData = {};

  // Get search option
  let address = req.body.address || "";
  let startDate = new Date(req.body.startDate);
  let endDate = new Date(req.body.endDate);
  let adult = req.body.adult || 1;
  let children = req.body.children || 0;
  let room = req.body.room || 1;
  let minPrice = req.body.minPrice || 1;
  let maxPrice = req.body.maxPrice || 999999;

  // Fix type
  address = toStandard(address);
  adult = parseInt(adult);
  children = parseInt(children);
  room = parseInt(room);
  minPrice = Number(minPrice);
  maxPrice = Number(maxPrice);

  // Set options to send back to client
  resData.options = {
    address,
    startDate,
    endDate,
    adult,
    children,
    room,
    minPrice,
    maxPrice,
  };

  let hotels;
  let trans;

  // Lấy tất cả khách sạn và giao dịch
  try {
    //Trả về tất cả các khách sạn điền thông tin vào các phòng vào kết quả trả về và thực thi câu truy vấn
    hotels = await Hotel.find().populate("rooms").exec();
    //Lấy danh sách các giao dịch từ csdl
    trans = await Transaction.find();
  } catch (err) {
    // Nếu xảy ra lỗi
    console.log(err);
    resData.type = "Error";
    resData.message = "Some errors occur in server - " + err.toString();
    return res.status(500).json(resData);
  }

  // Lọc danh sách giao dịch để chỉ giữ lại những giao dịch có phòng bận. 
  //Điều kiện lọc kiểm tra xem ngày bắt đầu và ngày kết thúc của giao dịch nằm trong khoảng thời gian startDate và endDate.
  trans = trans.filter(
    (tran) =>
      tran.startDate.getTime() <= endDate.getTime() &&
      tran.endDate.getTime() >= startDate.getTime()
  );

  // Nhóm giao dịch theo hotelId
  transObj = groupBy(trans, "hotel");

  // Tạo đối tượng phòng bận
  const busyHotels = {};

  // Lặp qua khóa đối tượng (hotelId)
  for (let key of Object.keys(transObj)) {
    // Kết hợp số phòng trong các giao dịch theo khóa (hotelId)
    //Trong vòng lặp, mỗi giao dịch được truy cập được lặp qua từng khóa (key) của đối tượng transObj.
    busyHotels[key] = transObj[key].reduce((busyRooms, tran) => {
      //Thêm tất cả các phần tử của mảng tran.rooms vào mảng rns.
      busyRooms.push(...tran.rooms);
      return busyRooms;
    }, []);
  }

  // Loại bỏ các phòng bận khỏi danh sách phòng trống của tất cả khách sạn.
  hotels.forEach((hotel) => {
    // Lấy danh sách phòng bận từ đối tượng busyHotels dựa trên hotel._id.
    const busyRooms = busyHotels[hotel._id];
    // Nếu không có phòng bận bỏ qua phần này và tiếp tục với khách sạn tiếp theo trong vòng lặp.
    if (!busyRooms) return;
    // Lặp qua từng phòng trong danh sách hotel.rooms của khách sạn.
    hotel.rooms.forEach((room) => {
      // Lọc các số phòng (roomNumbers) không bận trong phòng hiện tại. 
      //Các số phòng bị loại bỏ là những số phòng có trong danh sách busyRooms.
      room.roomNumbers = room.roomNumbers.filter(
        (roomNumber) => !busyRooms.includes(roomNumber)
      );
    });
  });

  // Split phần tử bằng cách tách chuỗi address dựa vào khoảng trắng
  const addrTokens = address.split(" ");

  // Filter hotel by address
  hotels = hotels.filter((hotel) => {
    return (
      addrTokens.every((token) => toStandard(hotel.address).includes(token)) ||
      addrTokens.every((token) => toStandard(hotel.city).includes(token)) ||
      addrTokens.every((token) => toStandard(hotel.name).includes(token))
    );
  });

  // Lọc các khách sạn dựa theo số người và phòng
  hotels = hotels.filter((hotel) => {
    const totalRooms = hotel.rooms
      //Tính tổng số phòng(totalRooms) của khách sạn bằng cách lặp qua danh sách hotel.rooms và cộng dồn số lượng phòng trong mỗi phòng.
      //Nếu hotel.rooms là null hoặc undefined, totalRooms được đặt là 0.
      ? hotel.rooms.reduce((tp, room) => tp + room.roomNumbers.length, 0)
      : 0;
    //Tính tổng số người (totalPeople) của khách sạn bằng cách lặp qua danh sách hotel.rooms và tính tổng số lượng người trong mỗi phòng 
    //(số phòng nhân với số người tối đa có thể ở trong mỗi phòng). Nếu hotel.rooms là null hoặc undefined, totalPeople được đặt là 0.
    const totalPeople = hotel.rooms
      ? hotel.rooms.reduce((tp, room) => tp + room.roomNumbers.length * room.maxPeople, 0)
      : 0;
    //Trả về true nếu tổng số phòng (totalRooms) lớn hơn hoặc bằng số phòng yêu cầu (room) và tổng số người (totalPeople) lớn hơn hoặc 
    //bằng tổng số người lớn (adult) và trẻ em (children) yêu cầu.
    return totalRooms >= room && totalPeople >= adult + children;
  });

  // Lọc các khách sạn theo price
  hotels = hotels.filter((hotel) => {
    // Mảng chứa giá phòng của từng phòng trong khách sạn
    const roomPrices = hotel.rooms.map((room) => room.price);
    //Tìm giá phòng cao nhất trong roomPrices.Nếu danh sách rỗng, hotelMaxPrice được đặt là - 1.
    const hotelMaxPrice = Math.max(...roomPrices, -1);
    //Tìm giá phòng thấp nhất trong roomPrices. Nếu danh sách rỗng, hotelMinPrice được đặt là 1.
    const hotelMinPrice = Math.min(...roomPrices, 1);
    // Trả về true nếu giá phòng cao nhất (hotelMaxPrice) nhỏ hơn hoặc bằng giá phòng tối đa (maxPrice) 
    //và giá phòng thấp nhất (hotelMinPrice) lớn hơn hoặc bằng giá phòng tối thiểu (minPrice).
    return hotelMaxPrice <= maxPrice && hotelMinPrice >= minPrice;
  });

  // Get cheapest price
  // hotels = hotels.map((item) => {
  //   const tmpItem = item.toObject();
  //   // tmpItem.cheapestPrice = getCheapestPrice(tmpItem);
  //   return tmpItem;
  // });

  resData.type = "Success";
  //Đặt giá trị của thuộc tính items trong đối tượng resData thành danh sách hotels đã được lọc và thay đổi.
  resData.items = hotels;
  //Trả về dữ liệu JSON bằng cách gửi đối tượng resData dưới dạng phản hồi HTTP.
  return res.json(resData);
};

// POST - /api/hotel/search/free-rooms
exports.postFreeRoomsSearch = async (req, res, next) => {
  // Tạo một đối tượng resData để chứa dữ liệu trả về
  const resData = {};

  // Lấy thông tin tìm kiếm từ yêu cầu gửi từ client
  // `hotelId` là ID của khách sạn cần tìm kiếm
  // `startDate` và `endDate` là ngày bắt đầu và kết thúc của kỳ nghỉ
  const hotelId = req.body.hotelId;
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.startDate);

  // Gửi thông tin tìm kiếm về cho client
  resData.options = { hotelId, startDate, endDate };

  let hotel;
  let trans;

  // Lấy thông tin khách sạn dựa trên `hotelId` và tất cả giao dịch liên quan
  try {
    hotel = await Hotel.findById(hotelId).populate("rooms").exec();
    trans = await Transaction.find();
  } catch (err) {
    // Nếu xảy ra lỗi trong quá trình lấy dữ liệu
    console.log(err);
    resData.type = "Error";
    resData.message = "Some errors occur in the server: " + err.toString();
    return res.status(500).json(resData);
  }

  // Kiểm tra nếu không tìm thấy khách sạn với ID đã cung cấp.
  if (!hotel) {
    (resData.type = "Error"), (resData.message = "Hotel not found");
    return res.status(404).json(resData);
  }

  //Lọc danh sách trans để chỉ giữ lại các giao dịch có hotelId tương ứng.
  trans = trans.filter((tran) => tran.hotel.toString() === hotelId);

  // Lọc danh sách trans dựa trên một số điều kiện liên quan đến ngày.
  trans = trans.filter(
    (tran) =>
      tran.startDate.getTime() <= endDate.getTime() &&
      tran.endDate.getTime() >= startDate.getTime()
  );

  // Tạo một danh sách busyRooms chứa các phòng bận rộn trong danh sách trans.
  const busyRooms = trans.reduce((rns, tran) => {
    //Thêm các phòng trong giao dịch (tran.rooms) vào danh sách rns.
    rns.push(...tran.rooms);
    return rns;
  }, []);

  // Filter room numbers that are not busy
  if (hotel.rooms) {
    //Lọc danh sách roomNumbers của mỗi phòng trong danh sách hotel.rooms, chỉ giữ lại các số phòng không bận
    hotel.rooms.forEach((room) => {
      room.roomNumbers = room.roomNumbers.filter((rn) => !busyRooms.includes(rn));
    });
  }

  const objHotel = hotel.toObject();
  // objHotel.cheapestPrice = getCheapestPrice(objHotel);

  resData.type = "Success";
  resData.item = objHotel;
  //Trả về dữ liệu JSON bằng cách gửi đối tượng resData dưới dạng phản hồi HTTP.
  return res.json(resData);
};

// POST - /api/hotel/delete-by-id
exports.postDeleteHotelById = async (req, res, next) => {
  // Response data
  const resData = {};

  // Lấu id từ req body
  const hotelId = req.body.hotelId;

  try {
    // Cập nhập trạng thái gia dịch
    await updateTransactionStatus();

    // Lấy các giao dịch có trạng thái "Booked" hoặc "Check in" của khách sạn này
    const trans = await Transaction.find({
      hotel: new ObjectId(hotelId),
      $or: [{ status: "Check in" }, { status: "Booked" }],
    });

    // Nếu khách sạn đang có khách thuê
    if (trans.length > 0) {
      resData.type = "Error";
      resData.message =
        "This hotel cannot be deleted. The hotel has rooms that are currently rented.";
      return res.status(400).json(resData);
    }

    // Nếu không thì xoá khách sạn
    await Hotel.findByIdAndDelete(hotelId);

    // Xóa các giao dịch có tham chiếu đến khách sạn
    await Transaction.remove({ hotel: new ObjectId(hotelId) });

    resData.type = "Success";
    resData.message = "Delete hotel successfully.";
    return res.json(resData);

    // Nếu có lỗi
  } catch (error) {
    resData.type = "Error";
    resData.message = "Some error occur in server - " + err.toString();
    //Trả về phản hồi HTTP với mã trạng thái 500 và dữ liệu JSON chứa đối tượng resData.
    return res.status(500).json(resData);
  }
};