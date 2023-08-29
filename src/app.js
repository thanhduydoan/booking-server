// Import các module
const express = require("express"); // Framework web
const session = require("express-session"); // Middleware session
const passport = require("passport"); // Middleware xác thực
const bodyParser = require("body-parser"); // Middleware phân tích cú pháp của req.body
const mongoose = require("mongoose"); // Thư viện truy cập CSDL MongoDB
const cors = require("cors"); // Middleware cho phép CORS
const crypto = require('crypto'); // Module mã hóa

// Import các routes
const authRoutes = require("./routes/auth"); // Routes xác thực
const hotelRoutes = require("./routes/hotel"); // Routes khách sạn
const tranRoutes = require("./routes/transaction"); // Routes giao dịch
const userRoutes = require("./routes/user"); // Routes người dùng
const roomRoutes = require("./routes/room"); // Routes phòng

// Tạo server
const app = express();

// Phân tích dữ liệu từ form submit application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// Phân tích dữ liệu từ application/json
app.use(bodyParser.json());

// Cho phép tất cả các CORS request
app.use(cors({ credentials: true, origin: true }));

// Tạo chuỗi bí mật ngẫu nhiên cho session
const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString('hex');
};

const secret = generateRandomString(32);

// Sử dụng session
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: secret, // Chuỗi bí mật cho session
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Thời gian sống của cookie
    },
  })
);

// Check if in production environment
if (process.env.NODE_ENV === "production") {
  // Use secure session configuration for production environment
  app.set("trust proxy", 1);
  app.use(
    session({
      secret: secret,
      resave: true,
      saveUninitialized: true,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        secure: true, // Đặt secure thành true trong môi trường sản xuất
      },
    })
  );
}

// Sử dụng passport
app.use(passport.initialize());
app.use(passport.session());

// Sử dụng các routes
app.use("/api/auth", authRoutes); // Sử dụng routes xác thực
app.use("/api/hotel", hotelRoutes); // Sử dụng routes khách sạn
app.use("/api/transaction", tranRoutes); // Sử dụng routes giao dịch
app.use("/api/user", userRoutes); // Sử dụng routes người dùng
app.use("/api/room", roomRoutes); // Sử dụng routes phòng

// Kết nối tới CSDL và chạy server
mongoose
  .connect(
    "mongodb+srv://doanduythanh:12345@cluster0.q7hdcal.mongodb.net/"
  )
  .then(() => {
    app.listen(8080); // Lắng nghe các yêu cầu tới cổng 8080
  })
  .catch((err) => {
    console.log(err);
  });

// Xuất app
module.exports = app;
