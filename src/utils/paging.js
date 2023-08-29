// Chức năng phân trang
const paging = (items, page, pageSize) => {
  // Tính chỉ số đầu tiên và cuối cùng của mảng đ
  const indexFirst = page * pageSize - pageSize;
  const indexLast = page * pageSize;
  // Tách mảng
  const pagedItems = items.slice(indexFirst, indexLast);
  // Tạo đối tượng phân trang
  const paged = {
    page: page,
    page_size: pageSize,
    page_count: Math.ceil(items.length / pageSize),
    item_count: items.length,
    items: pagedItems,
  };
  // Return paged object
  return paged;
};

module.exports = paging;
