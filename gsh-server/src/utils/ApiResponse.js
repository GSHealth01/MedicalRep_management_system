class ApiResponse {
  static ok(res, message = "Success", data = null, status = 200) {
    return res.status(status).json({ success: true, message, data });
  }
}
module.exports = ApiResponse;
