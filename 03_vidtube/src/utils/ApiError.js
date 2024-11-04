class ApiError extends Error {
  constructor(
    statusCode,
    message = "something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    // If the stack is already provided, it goes to if statement
    if (stack) {
      this.stack = stack;
    }
    // If the stack is not provided,we use Node.js’s built-in method Error.captureStackTrace() to capture the current stack trace and associate it with the error instance.
    // Error.captureStackTrace(targetObject[, constructorOpt])
    // targetObject : it is the error object that you want to attach the stack trace to.
    // constructorOpt : This is a reference to the constructor fn you want to exclude from the stack trace. (just to get clean response)
    else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
