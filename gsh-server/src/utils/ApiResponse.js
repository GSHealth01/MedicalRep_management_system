class ApiResponse {
  static ok(res, message = "Success", data = null, status = 200) {
    return res.status(status).json({ success: true, message, data });
  }

  static error(res, message = "Error", status = 500) {
    return res.status(status).json({ success: false, message });
  }
}
module.exports = ApiResponse;
