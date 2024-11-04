//  we always write api in class for consistency in our code (frontend dev can understand statusCode data message easily)

class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400; // return true or false
  }
}

export { ApiResponse };
