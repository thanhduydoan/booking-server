// Hàm nhóm một mảng thành một đối tượng theo một thuộc tính được chỉ định
const groupBy = (arr, attr, keepAttr = true) => {
  // Tạo đối tượng nhóm bằng cách giảm mảng đầu vào
  return arr.reduce((resObj, obj) => {
    // Lấy trường vào nhóm
    const field = obj[attr];
    // Xóa tệp khỏi obj (tùy chọn)
    if (!keepAttr) delete obj[attr];

    // Nếu trường này chưa tồn tại
    if (!resObj[field]) resObj[field] = [obj];
    // Nếu trường này đã tồn tại
    else resObj[field].push(obj);

    // Trả về đối tượng rút gọn
    return resObj;
  }, {});
};

exports.groupBy = groupBy;
